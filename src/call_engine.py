import os
import hashlib
import json
import asyncio
import subprocess
from typing import Dict, Any
from .schemas import WebhookPayload, CallResult, Outcome, CALL_E_RESULT_SCHEMA

# Telemetry env vars
CALLE_ENV = {
    **os.environ,
    "CALLE_SOURCE": "skills_sh",
    "CALLE_INTEGRATION": "skills_sh_skill",
    "CALLE_INTEGRATION_VERSION": "0.1.0"
}

SYSTEM_PROMPT_TEMPLATE = """
You are an automated billing assistant for [Company].
Your goal is to call the customer about a failed payment of ${amount}.
Offer to resend the invoice or ask when they will update their card.

STRICT SAFETY RULE: Never ask for, accept, or repeat credit card numbers,
CVVs, or passwords. If the user tries to give you a card number, politely
tell them you cannot accept it over the phone and they must use the secure
link in the email.

Extract the following structured data at the end of the call:
- outcome: One of "payment_promised", "disputed", "no_answer", "voicemail", "callback_requested"
- promised_date: If they promised to pay, the date (YYYY-MM-DD)
- dispute_reason: If disputed, the reason
- escalation_required: Boolean indicating if human review is needed
- notes: Brief summary of the conversation
"""

def make_idempotency_key(payload: WebhookPayload, attempt: int) -> str:
    """Creates unique key to prevent duplicate calls."""
    raw = f"{payload.customer_id}-{payload.trigger_id}-{attempt}"
    return hashlib.sha256(raw.encode()).hexdigest()

async def _run_calle_command(args: list) -> Dict[str, Any]:
    """Helper to run calle CLI commands asynchronously."""
    cmd = ["calle"] + args
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        env=CALLE_ENV,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    stdout, stderr = await process.communicate()
    
    if process.returncode != 0:
        raise Exception(f"calle CLI failed: {stderr.decode()}")
    
    return json.loads(stdout.decode())

async def execute_rescue_call(payload: WebhookPayload, attempt: int = 1) -> CallResult:
    """
    Executes the 2-step CALL-E workflow:
    1. plan_call → get plan_id and confirm_token
    2. run_call → execute the call
    3. get_call_run → poll for results
    """
    
    idempotency_key = make_idempotency_key(payload, attempt)
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(amount=payload.amount)
    
    # ── DRY-RUN MODE ──────────────────────────────────────────
    if os.getenv("CALL_E_DRY_RUN", "false").lower() == "true":
        print(f"[DRY RUN] Simulating call to {payload.customer_phone}")
        return CallResult(
            outcome=Outcome.PAYMENT_PROMISED,
            promised_date="2026-09-10",
            escalation_required=False,
            notes="Customer agreed to update card tomorrow. (Simulated)"
        )
    
    try:
        # STEP 1: Plan the call
        print(f"[CALL-E] Step 1/3: Planning call for {payload.customer_phone}...")
        
        plan_payload = {
            "to_phones": [payload.customer_phone],
            "goal": system_prompt,
            "user_input": f"Call {payload.customer_phone} about failed payment of ${payload.amount}"
        }
        
        plan_result = await _run_calle_command([
            "plan_call",
            json.dumps(plan_payload)
        ])
        
        plan_id = plan_result["plan_id"]
        
        if not plan_result.get("ready_to_run", False):
            raise Exception(f"Call plan not ready: {plan_result.get('clarifying_questions', [])}")
        
        confirm_token = plan_result.get("confirm_token")
        if not confirm_token:
            raise Exception("No confirm_token returned from plan_call")
        
        # STEP 2: Run the call
        print(f"[CALL-E] Step 2/3: Executing call (plan_id: {plan_id})...")
        
        run_result = await _run_calle_command([
            "run_call",
            json.dumps({
                "plan_id": plan_id,
                "confirm_token": confirm_token
            })
        ])
        
        run_id = run_result["run_id"]
        print(f"[CALL-E] Call started (run_id: {run_id})")
        
        # STEP 3: Poll for completion
        print(f"[CALL-E] Step 3/3: Polling for results...")
        
        while True:
            status_result = await _run_calle_command([
                "get_call_run",
                json.dumps({"run_id": run_id, "limit": 100})
            ])
            
            status = status_result.get("status", "UNKNOWN")
            print(f"[CALL-E] Status: {status}")
            
            if status in ["COMPLETED", "NO ANSWER", "FAILED", "DECLINED"]:
                # Extract structured results
                result_data = status_result.get("result", {})
                extracted = result_data.get("extracted", {})
                transcript = result_data.get("transcript", "")
                
                # Map to our CallResult schema
                outcome_str = extracted.get("outcome", "no_answer")
                try:
                    outcome = Outcome(outcome_str)
                except ValueError:
                    outcome = Outcome.NO_ANSWER
                
                return CallResult(
                    outcome=outcome,
                    promised_date=extracted.get("promised_date"),
                    dispute_reason=extracted.get("dispute_reason"),
                    escalation_required=extracted.get("escalation_required", True),
                    notes=extracted.get("notes", "Call completed"),
                    transcript=transcript
                )
            
            # Wait before polling again
            await asyncio.sleep(2)
            
    except Exception as e:
        print(f"[CALL-E ERROR] {e}")
        return CallResult(
            outcome=Outcome.NO_ANSWER,
            escalation_required=True,
            notes=f"Call execution failed: {str(e)}"
        )