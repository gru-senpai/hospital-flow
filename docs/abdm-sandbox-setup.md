# ABDM Sandbox Setup

**Checked:** 2026-10-23
**Status:** Blocked pending capability selection, accessible current integration documentation, and authorized sandbox enrollment.

## Current setup

No ABDM SDK/client, API route, callback handler, sandbox environment configuration, or credentials are present in the repository. Do not add guessed API URLs, environment variable names, payloads, or callback behavior.

The official sandbox portal is [sandbox.abdm.gov.in](https://sandbox.abdm.gov.in/). It rendered a JavaScript application shell during this review; versioned integration documentation and enrollment details were not available in the retrieved content. Use the current official portal and documentation linked from it to confirm instructions.

## Safe setup procedure once the official flow is confirmed

1. Select and document the exact sandbox capability and participant role.
2. Complete official sandbox enrollment and use only authorized sandbox credentials and approved synthetic test identities.
3. Confirm the official API base URL, version, authentication model, payload schemas, callbacks, certificate/signature requirements if any, and allowed test data before writing a client.
4. Put secrets in Vercel environment-variable management for **Preview** only, scoped to the project/team. Never place them in `VITE_*` variables, browser code, `.env.example` values, source control, logs, or chat.
5. Keep Preview/Sandbox credentials separate from Production. Never copy production credentials into Preview.
6. Implement server-side configuration validation and fail deployment/startup clearly if required configuration is missing; do not silently fall back to mock success.
7. Add timeouts, bounded retries for retryable failures, safe error normalization, callback authenticity/replay defenses as specified by official docs, and auditable state transitions.
8. Test unauthorized, malformed, expired, replayed, duplicate, timeout, and provider-error cases using controlled sandbox fixtures.

## Configuration inventory

No environment variable names are declared yet because the official flow and authentication contract have not been verified. After contract review, document **names and purpose only** in a safe example file and configure actual values through Vercel secret management. Never print or commit values.

## Verification checklist

- [ ] Official current API contract/version is cited in implementation documentation.
- [ ] Sandbox enrollment and capability are authorized.
- [ ] All secrets are server-only and preview-scoped.
- [ ] No production identity or real patient data is used.
- [ ] Adapter rejects malformed/untrusted responses and callbacks.
- [ ] No false success or "verified" state is possible.
- [ ] Logs redact identifiers, credentials, tokens, and payloads.
- [ ] Production integration remains disabled until separate approval.
