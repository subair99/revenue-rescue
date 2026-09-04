import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .schemas import WebhookPayload, CallResult
from .decision_engine import evaluate_trigger
from .call_engine import execute_rescue_call

load_dotenv()

app = FastAPI(title="Revenue Rescue", version="0.1.0")

# ── ADD CORS MIDDLEWARE ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)
# ──────────────────────────────────────────────────────────────

@app.post("/webhook/revenue-rescue")
async def revenue_rescue_webhook(payload: WebhookPayload):
    # 1. Decision Engine
    decision = evaluate_trigger(payload)
    if not decision["proceed"]:
        print(f"[SKIPPED] {decision['reason']}")
        return {"status": "skipped", "reason": decision["reason"]}
    
    # 2. Execute CALL-E (2-step workflow)
    print(f"[CALLING] {decision['reason']}")
    result = await execute_rescue_call(payload, attempt=1)
    
    # 3. Downstream actions
    if result.outcome.value == "payment_promised":
        print(f"[SUCCESS] Recovery in progress. Promised: {result.promised_date}")
    elif result.outcome.value == "disputed":
        print(f"[ESCALATE] Dispute detected: {result.dispute_reason}")
    
    return {"status": "completed", "result": result.model_dump()}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "dry_run": os.getenv("CALL_E_DRY_RUN", "false"),
        "calle_authenticated": True
    }