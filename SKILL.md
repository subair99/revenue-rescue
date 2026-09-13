---
name: "revenue-rescue"
title: "Revenue Rescue"
description: "Agent skill for packaging revenue recovery phone-call workflows with strict safety boundaries, structured result schemas, and dry-run-by-default execution."
tags: ["revenue", "finance", "safety", "governed", "automation", "payments"]
---

# Revenue Rescue Skill

## Overview
**Revenue Rescue** is an agent skill for packaging revenue recovery phone-call workflows. It detects high-value operational exceptions (e.g., failed payments), evaluates them through a decision engine, and executes multi-step CALL-E phone interactions with strict safety boundaries and structured result extraction.

**This skill requires:**
- An agent host (Claude Code, Cursor, MCP client) to invoke it
- A scheduler (external to this skill) for recurring workflows
- **Explicit human approval before any live CALL-E execution**

## When to Use This Skill
Use this skill when an AI agent needs to:
- Recover revenue from failed payments or expired cards
- Follow up on high-value operational exceptions
- Execute a phone call that requires strict adherence to safety and structured data extraction

## Prerequisites & Setup
1. **CALL-E CLI**: Must be installed and authenticated (`npm install -g @call-e/cli` + `calle auth login`)
2. **Environment**: Set `CALL_E_DRY_RUN=true` in your `.env` file (default) to test without placing live calls
3. **Dependencies**: Ensure the host environment has access to the `@call-e/cli`

## Input Payload Schema
The skill expects a structured trigger payload (e.g., from a webhook). Example:
```json
{
  "customer_id": "cus_demo_123456",
  "customer_phone": "+1-555-0100",
  "trigger_id": "evt_stripe_failed_987",
  "amount": 249.00,
  "failure_reason": "expired_card",
  "is_disputed": false,
  "timestamp": "2026-09-09T14:30:00Z"
}
```

## ⚠️ Strict Safety & Compliance Boundaries
This skill enforces enterprise-grade safety constraints. The AI agent **MUST** adhere to these rules:
1. **NO PCI/PII Collection**: The agent is strictly forbidden from asking for, accepting, or repeating credit card numbers, CVVs, passwords, or SSNs. Users must be directed to secure email links.
2. **Idempotency**: Every call attempt must use a unique idempotency key (SHA-256 hash of `customer_id` + `trigger_id` + `attempt_number`) to prevent duplicate calls.
3. **Quiet Hours Guard**: Do not initiate calls outside of 08:00 - 21:00 local time. Queue for the next business day.
4. **Dispute Routing**: If `is_disputed` is `true`, bypass the phone system entirely and route to human/Zendesk.
5. **Fail-Closed Ambiguity**: If a call outcome is `unknown` or `failed`, do not blindly retry. Flag for human reconciliation.
6. **No Automatic Redial**: No-answer and ambiguous outcomes route to human reconciliation, not automatic retry.

## Execution Workflow
When triggered, the agent should follow this sequence:
1. **Evaluate**: Run the input payload through the Decision Engine (check amount > $50, not disputed, within quiet hours).
2. **Plan**: If approved, invoke the CALL-E `plan_call` tool with a dynamic, safety-gated goal.
3. **Execute**: Upon receiving a `confirm_token`, invoke `run_call`.
4. **Poll**: Use `get_call_run` to poll for the terminal status (`COMPLETED`, `NO ANSWER`, `FAILED`, `DECLINED`).
5. **Extract & Route**: Parse the structured JSON result and trigger the appropriate downstream action.

## Expected Structured Result (`resultSchema`)
The CALL-E execution is enforced to return strictly typed JSON:
```json
{
  "outcome": {
    "type": "string",
    "enum": ["payment_promised", "disputed", "no_answer", "voicemail", "callback_requested"]
  },
  "promised_date": { "type": "string", "format": "date", "description": "YYYY-MM-DD if applicable" },
  "dispute_reason": { "type": "string", "description": "Reason if outcome is disputed" },
  "escalation_required": { "type": "boolean" },
  "notes": { "type": "string", "description": "Brief summary of the conversation or failure reason" }
}
```

## Downstream Actions
- **If `outcome == "payment_promised"`**: Update CRM status to "Recovery in Progress" and schedule follow-up.
- **If `outcome == "disputed"`**: Create support ticket and flag for human review.
- **If `outcome == "no_answer"`**: Route to human reconciliation (no automatic retry).

## Testing & Dry-Run Mode
To test the complete logic flow **without burning CALL-E credits or placing live calls**:

1. Ensure `CALL_E_DRY_RUN=true` is set in the environment (default).
2. An external host should intercept the CLI invocation and return a realistic, schema-compliant mock response.
3. See `scripts/dry-run-test.sh` for a template of how an external host might structure this test.

## ❌ What This Is Not
- ❌ **Not a standalone backend or service**: This package contains no backend implementing the documented enforcement.
- ❌ **Not an autonomous agent**: It does not place calls by itself; it requires an external agent host to invoke it.
-  **Not an enterprise application**: It is a skill definition package, not a turnkey SaaS product.
- ❌ **Not a runnable app**: It requires an external scheduler for recurring workflows and explicit human approval.

##  References
- [Safety & Consent Guidelines](references/safety.md)
- [Structured Result Schema Definition](references/schema.json)
- [Main Documentation](docs/README.md)