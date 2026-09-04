# Revenue Rescue
**Autonomous, Governed Revenue Recovery & Operations Agent**

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![CALL-E](https://img.shields.io/badge/Powered%20by-CALL--E-orange.svg)](https://call-e.ai/)

Don’t use AI calling to make *more* calls; use it to recover money and operations that are actively slipping away. **Revenue Rescue** is an agentic workflow that detects high-value operational exceptions (e.g., failed Stripe payments), runs them through a "Should We Call?" decision engine, and executes a governed, multi-step CALL-E phone interaction. 

It extracts structured resolutions, respects strict safety boundaries (no PII/financial data collection), and writes actionable outcomes back to business systems—turning unstructured phone chaos into governed, measurable ROI.

---

## Architecture & Workflow

```mermaid
sequenceDiagram
    participant Stripe as External Trigger (e.g., Stripe)
    participant BE as Revenue Rescue Backend (FastAPI)
    participant DE as Decision Engine
    participant CALLE as CALL-E SDK/CLI
    participant DB as Database / CRM

    Stripe->>BE: Webhook (Failed Payment: $249)
    BE->>DE: Evaluate Business Rules
    DE-->>BE: Proceed (Amount > $50, Not Disputed, Within Quiet Hours)
    BE->>CALLE: 1. plan_call (Goal + Safety Prompt)
    CALLE-->>BE: plan_id + confirm_token
    BE->>CALLE: 2. run_call (confirm_token)
    CALLE-->>BE: run_id (Async execution)
    BE->>CALLE: 3. get_call_run (Poll for status)
    CALLE-->>BE: Structured JSON (resultSchema)
    BE->>DB: Write-back: "Recovery in Progress" / "Escalate to Human"
```

```mermaid
graph TD
    %% Node Definitions
    Stripe([External Trigger<br/>e.g., Stripe])
    BE{Revenue Rescue<br/>Backend FastAPI}
    DE[Decision Engine]
    CALLE((CALL-E<br/>SDK / CLI))
    DB[(Database / CRM)]

    %% Workflow Edges
    Stripe -->|1. Webhook: Failed Payment $249| BE
    BE -->|2. Evaluate Business Rules| DE
    DE -->|3. Proceed: >$50, Not Disputed, Quiet Hours| BE
    
    BE -->|4. plan_call: Goal + Safety Prompt| CALLE
    CALLE -->|5. Return: plan_id + confirm_token| BE
    
    BE -->|6. run_call: confirm_token| CALLE
    CALLE -->|7. Return: run_id Async execution| BE
    
    BE -->|8. get_call_run: Poll for status| CALLE
    CALLE -->|9. Return: Structured JSON resultSchema| BE
    
    BE -->|10. Write-back: Recovery in Progress / Escalate| DB

    %% Styling for better visual appeal
    classDef trigger fill:#f9f,stroke:#333,stroke-width:2px;
    classDef backend fill:#bbf,stroke:#333,stroke-width:2px;
    classDef engine fill:#dfd,stroke:#333,stroke-width:2px;
    classDef calle fill:#ff9,stroke:#f66,stroke-width:3px;
    classDef db fill:#ddf,stroke:#333,stroke-width:2px;

    class Stripe trigger;
    class BE backend;
    class DE engine;
    class CALLE calle;
    class DB db;
```

---

## Criteria Alignment

1. **Real-World Impact (Measurable ROI)**: Solves direct financial bleed. A SaaS company recovering just 10% of 1,000 failed payments/month saves $5,000+. The system pays for itself on Day 1.
2. **Quality of Idea (Multi-Step Cascade)**: Not a simple one-shot reminder. It evaluates *who* to call, executes the call, and uses retry cascade logic (no answer → wait 2h → retry → escalate).
3. **Technical Implementation (Deep Integration)**: Uses the official `@call-e/cli` at runtime with strict `resultSchema` enforcement, idempotency keys, and a dedicated Dry-Run mode for safe testing.
4. **Safety-First Architecture**: Explicit consent tracking, quiet-hour guards, and a **strict rule**: The agent *never* asks for or processes card numbers, passwords, or PINs.

---

## Quick Start & Setup

### 1. Prerequisites
- Python 3.12+ and [`uv`](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js 18+ and `npm`
- CALL-E CLI installed and authenticated

### 2. Initial Project Setup
If you are building this from scratch or verifying the environment, run these commands:
```bash
# 1. Initialize project and dependencies
mkdir revenue-rescue && cd revenue-rescue
uv init --no-readme --vcs none
rm main.py
uv add fastapi uvicorn pydantic python-dotenv httpx

# 2. Install CALL-E Skill and CLI globally
npx -y skills add https://github.com/CALLE-AI/call-e-integrations --skill calle -g
sudo npm install -g @call-e/cli

# 3. Create the Next.js app in a 'frontend' folder
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd frontend

# 4. Install icons and a lightweight charting library
npm install lucide-react recharts
```

### 3. Else Use This Setup
```bash
# 1. Backend Setup (FastAPI)
git clone https://github.com/subair99/revenue-rescue
cd revenue-rescue

# Initialize and install Python dependencies
uv sync

# Create .env file
cp .env.example .env
# Edit .env and set: CALL_E_DRY_RUN=true (for safe testing)

# Start the backend server
uv run uvicorn src.main:app --reload --port 8000

# 3. Frontend Setup (Next.js Dashboard)
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Revenue Leakage Intelligence dashboard.

### 4. CALL-E Authentication (Critical Step)
```bash
# Step A: Generate login URL
env CALLE_SOURCE=skills_sh CALLE_INTEGRATION=skills_sh_skill CALLE_INTEGRATION_VERSION=0.1.0 calle auth login --start-only --no-browser-open

# Step B: Copy the generated URL into your web browser and complete authorization.

# Step C: Finalize login in the terminal
env CALLE_SOURCE=skills_sh CALLE_INTEGRATION=skills_sh_skill CALLE_INTEGRATION_VERSION=0.1.0 calle auth login --no-browser-open

# Step D: Verify authentication and tools
env CALLE_SOURCE=skills_sh CALLE_INTEGRATION=skills_sh_skill CALLE_INTEGRATION_VERSION=0.1.0 calle auth status
env CALLE_SOURCE=skills_sh CALLE_INTEGRATION=skills_sh_skill CALLE_INTEGRATION_VERSION=0.1.0 calle mcp tools
```

### 5. Test the Backend (Optional but Recommended)
```bash
curl -X POST http://localhost:8000/webhook/revenue-rescue \
  -H "Content-Type: application/json" \
  -d @fixtures/failed_payment.json
  ```

---

## Safety Boundaries (Critical)

This project is designed with enterprise-grade safety constraints to prevent disqualification and ensure compliance:
1. **NO PCI/PII Collection**: The `SYSTEM_PROMPT_TEMPLATE` explicitly forbids the agent from asking for, accepting, or repeating credit card numbers, CVVs, passwords, or SSNs.
2. **Idempotency**: Every call attempt generates a unique SHA-256 hash (`customer_id` + `trigger_id` + `attempt_number`) to guarantee a customer is never called twice for the same invoice.
3. **Quiet Hours Guard**: The Decision Engine automatically blocks calls between 9:00 PM and 8:00 AM local time, queuing them for the next business day.
4. **Dispute Routing**: Known disputes (`is_disputed: true`) bypass the phone system entirely and route directly to Zendesk/CRM to avoid antagonizing the customer.

---

## API & Example Payloads

### Trigger Webhook
**Endpoint**: `POST /webhook/revenue-rescue`

**Example Payload** (`fixtures/failed_payment.json`):
```json
{
  "customer_id": "cus_123456789",
  "customer_phone": "+15551234567",
  "trigger_id": "evt_stripe_failed_987",
  "amount": 249.00,
  "failure_reason": "expired_card",
  "is_disputed": false,
  "timestamp": "2026-09-04T14:30:00Z"
}
```

### Structured Extraction (`resultSchema`)
CALL-E is enforced to return strictly typed JSON, enabling reliable downstream write-backs:
```json
{
  "outcome": "payment_promised",
  "promised_date": "2026-09-10",
  "dispute_reason": null,
  "escalation_required": false,
  "notes": "Customer agreed to update card tomorrow via the secure email link."
}
```

---

## Dry-Run Mode

To test the complete logic flow **without burning live CALL-E credits or making real phone calls**, set the following in your `.env` file:

```env
CALL_E_DRY_RUN=true
```

When enabled, the `execute_rescue_call` function intercepts the CLI invocation and returns a realistic, schema-compliant mock response (`payment_promised`), allowing judges to verify the end-to-end loop instantly.

## Live Test

1. **Use Your Own Number:** Update the `customer_phone` in the frontend's `triggerRescue` function (or in your `fixtures/failed_payment.json`) to **your actual mobile number** in E.164 format (e.g., `+15551234567`).
2. **Demonstrate the Safety Rule (Crucial for Judging!):** 
   * When the agent asks how you want to pay, **do not say your real credit card number**. 
   * Instead, say: *"I don't want to say my card number over the phone. Can you just email me the invoice and I'll update it online?"*
   * The agent should politely agree. This perfectly demonstrates the **Safety Boundaries** judging criteria!
3. **Watch the Terminal:** While you are on the phone, look at your backend terminal. You will see the `plan_call`, `run_call`, and `get_call_run` polling steps happening in real-time. This is the **"Technical Proof"** you need for your video.
4. **Check the Final JSON:** Once you hang up, the terminal will print the final structured JSON (the `resultSchema`). It should show `"outcome": "payment_promised"` and `"escalation_required": false`.

```env
CALL_E_DRY_RUN=false
```

---

## Deliverables Checklist

- [x] **Backend**: Python/FastAPI with genuine runtime CALL-E CLI execution (`plan_call` → `run_call` → `get_call_run`).
- [x] **Frontend**: Next.js Dashboard with "Revenue at Risk" and "Leakage Intelligence" analytics.
- [x] **SKILL.md**: Agent-friendly prompt and tool definitions for MCP hosts (included in repo root).
- [x] **Demo Video**: < 3-minute unlisted video demonstrating the full loop (Link in Devpost).
- [x] **Safety Documentation**: Explicitly documented and enforced in code.

---

## Demo Video

Watch the full <3 minute walkthrough of the Decision Engine, CALL-E runtime execution, and structured write-back:  
🔗 *[Insert Unlisted YouTube/Vimeo Link Here]*

[![Watch it here](pictures/video-thumbnail.png)](https://youtu.be/x2_reUGsFzo?si=m6iSPKpjZvE8q-Qa)

---

## Licence

**MIT License.**

*Built for the CALL-E Hackathon 2026.*

---
