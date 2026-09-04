from .schemas import CallResult, Outcome

async def handle_outcome(result: CallResult, customer_id: str):
    """Route the structured result to the right business system."""

    if result.outcome == Outcome.PAYMENT_PROMISED:
        print(f"[CRM] ✅ {customer_id} → Recovery in Progress (promised: {result.promised_date})")
        # TODO: Update Airtable / Postgres row
        # TODO: Schedule follow-up webhook for promised_date

    elif result.outcome == Outcome.DISPUTED:
        print(f"[ZENDESK] 🎫 {customer_id} → Ticket created: {result.dispute_reason}")
        # TODO: POST to Zendesk API

    elif result.outcome in (Outcome.NO_ANSWER, Outcome.VOICEMAIL):
        print(f"[RETRY] 📞 {customer_id} → Scheduling retry in 2 hours")
        # TODO: Enqueue retry job

    if result.escalation_required:
        print(f"[ESCALATE] 🚨 {customer_id} → Flagged for human review")