from datetime import datetime
from .schemas import WebhookPayload

def evaluate_trigger(payload: WebhookPayload) -> dict:
    """Decision Engine: evaluates business rules before calling."""
    
    # Rule 1: Financial threshold
    if payload.amount < 50:
        return {"proceed": False, "reason": "Amount below $50. Routing to email."}
    
    # Rule 2: Known disputes
    if payload.is_disputed:
        return {"proceed": False, "reason": "Known dispute. Routing to Zendesk."}
    
    # Rule 3: Quiet hours (8 AM - 9 PM local)
    try:
        hour = datetime.fromisoformat(payload.timestamp.replace("Z", "+00:00")).hour
        if hour < 8 or hour > 21:
            return {"proceed": False, "reason": "Outside quiet hours. Queued for morning."}
    except:
        pass  # If timestamp parsing fails, proceed anyway
    
    return {"proceed": True, "reason": "High-value, eligible for voice rescue."}