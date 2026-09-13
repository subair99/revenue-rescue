```bash
#!/bin/bash
# ==============================================================================
# NOTE: EXTERNAL BACKEND TEMPLATE
# This script is a TEMPLATE demonstrating how an external agent host or backend 
# would trigger this workflow. 
#
# THIS SKILL PACKAGE DOES NOT INCLUDE A RUNNABLE BACKEND.
# To test the CALL-E CLI directly in dry-run mode without a backend, follow 
# the "No-Call CLI Example" below.
# ==============================================================================

echo "🧪 Revenue Rescue Dry-Run Test (External Backend Template)"
echo "️  This skill package does not include a runnable backend. This script is a template."
echo ""

echo "📥 Expected Input Payload (from scripts/fixtures/mock-payload.json):"
cat "$(dirname "$0")/fixtures/mock-payload.json"
echo ""

echo "💡 No-Call CLI Example (Test directly without a backend):"
echo "   1. Ensure CALL-E is authenticated: calle auth login"
echo "   2. Run a dry-run plan (no live call placed):"
echo "      calle call plan --to-phone +1-555-0100 --goal 'Test dry-run' --json"
echo ""

echo "✅ Mock Expected Structured Output (what the external host would receive):"
cat << 'EOF'
{
  "outcome": "payment_promised",
  "promised_date": "2026-09-10",
  "dispute_reason": null,
  "escalation_required": false,
  "notes": "Customer agreed to update card via secure email link."
}
EOF
```