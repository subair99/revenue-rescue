from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional, Dict, Any

class Outcome(str, Enum):
    PAYMENT_PROMISED = "payment_promised"
    DISPUTED = "disputed"
    NO_ANSWER = "no_answer"
    VOICEMAIL = "voicemail"
    CALLBACK_REQUESTED = "callback_requested"

class WebhookPayload(BaseModel):
    customer_id: str
    customer_phone: str
    trigger_id: str
    amount: float
    failure_reason: str
    is_disputed: bool
    timestamp: str

class CallResult(BaseModel):
    outcome: Outcome
    promised_date: Optional[str] = None
    dispute_reason: Optional[str] = None
    escalation_required: bool = False
    notes: str = ""
    transcript: Optional[str] = None

# This is the resultSchema we enforce on CALL-E
CALL_E_RESULT_SCHEMA = {
    "type": "object",
    "properties": {
        "outcome": {
            "type": "string",
            "enum": ["payment_promised", "disputed", "no_answer", "voicemail", "callback_requested"]
        },
        "promised_date": {"type": "string"},
        "dispute_reason": {"type": "string"},
        "escalation_required": {"type": "boolean"},
        "notes": {"type": "string"}
    },
    "required": ["outcome", "escalation_required", "notes"]
}