import os
import hashlib
import json
import asyncio
from typing import Dict, Any
from .schemas import WebhookPayload, CallResult, Outcome, CALL_E_RESULT_SCHEMA

# Telemetry env vars required by CALL-E
CALLE_ENV = {
    **os.environ,
    "CALLE_SOURCE": "skills_sh",
    "CALLE_INTEGRATION": "skills_sh_skill",
    "CALLE_INTEGRATION_VERSION": "0.1.0"
}

# Compliant system prompt that passes CALL-E safety filters
SYSTEM_PROMPT_TEMPLATE = """
Call the customer to inform them that an invoice payment of ${amount} failed. 
Direct them to check their email for a secure link to update their billing information. 

STRICT SAFETY RULE: Do not ask for, collect, or handle any payment details, 
card numbers, account credentials, verification codes, or billing information over the phone. 
If the customer answers, deliver the notice clearly, answer only general non-sensitive questions, 
and direct any billing update action to the secure email link or official support channel; then end politely. 
If the customer refuses or is concerned, do not pressure them and advise them to use official support channels. 
If no one answers, leave a short voicemail with the same general notice and instruction to check email, 
without sensitive details, then report that nobody answered live.
"""

def make_idempotency_key(payload: WebhookPayload, attempt: int) -> str:
    """Creates unique key to prevent duplicate calls."""
    raw = f"{payload.customer_id}-{payload.trigger_id}-{attempt}"
    return hashlib.sha256(raw.encode()).hexdigest()

async def _run_calle_cli(args: list) -> Dict[str, Any]:
    """Helper to run calle CLI commands asynchronously with --json flag."""
    cmd = ["calle"] + args + ["--json"]
    
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
    Executes the CALL-E workflow using the official CLI with --json flag.
    """
    idempotency_key = make_idempotency_key(payload, attempt)
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(amount=payload.amount)
    
    # ── DRY-RUN MODE ─────────────────────────────────────────
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
        
        plan_result = await _run_calle_cli([
            "call", "plan",
            "--to-phone", payload.customer_phone,
            "--goal", system_prompt
        ])
        
        structured_content = plan_result.get("result", {}).get("structuredContent", {})
        plan_id = structured_content.get("plan_id")
        
        if not structured_content.get("ready_to_run", False):
            questions = structured_content.get("clarifying_questions", [])
            raise Exception(f"Call plan not ready. Reason: {questions[0] if questions else 'Unknown'}")
        
        confirm_token = structured_content.get("confirm_token")
        if not confirm_token:
            raise Exception("No confirm_token returned from plan_call")
        
        # STEP 2: Run the call
        print(f"[CALL-E] Step 2/3: Executing call (plan_id: {plan_id})...")
        
        run_result = await _run_calle_cli([
            "call", "run",
            "--plan-id", plan_id,
            "--confirm-token", confirm_token
        ])
        
        run_structured = run_result.get("result", {}).get("structuredContent", {})
        run_id = run_structured.get("run_id")
        print(f"[CALL-E] Call started (run_id: {run_id})")
        
        # STEP 3: Poll for completion
        print(f"[CALL-E] Step 3/3: Polling for results...")
        
        while True:
            status_result = await _run_calle_cli([
                "call", "status",
                "--run-id", run_id
            ])
            
            status_structured = status_result.get("result", {}).get("structuredContent", {})
            status = status_structured.get("status", "UNKNOWN")
            print(f"[CALL-E] Status: {status}")
            
            if status in ["COMPLETED", "NO ANSWER", "FAILED", "DECLINED"]:
                result_data = status_structured.get("result", {})
                extracted = result_data.get("extracted", {})
                transcript = result_data.get("transcript", "")
                
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
            
            await asyncio.sleep(3) # Poll every 3 seconds
            
    except Exception as e:
        print(f"[CALL-E ERROR] {e}")
        return CallResult(
            outcome=Outcome.NO_ANSWER,
            escalation_required=True,
            notes=f"Call execution failed: {str(e)}"
        )