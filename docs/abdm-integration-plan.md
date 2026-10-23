# ABDM Integration Plan

**Checked:** 2026-10-23
**Status:** Discovery only. No ABDM integration is implemented.

## Current state

The repository contains no ABDM client, API route, facility/professional registration flow, callback handler, consent manager, or ABHA identity workflow. There are no ABDM credentials or protocol definitions in the source. The current application is a browser-only synthetic-data prototype.

## Official references checked

- [ABDM official portal](https://abdm.gov.in/)
- [ABDM Sandbox](https://sandbox.abdm.gov.in/)
- [ABHA portal](https://abha.abdm.gov.in/)

The portals returned JavaScript application shells during this review. A versioned API contract, integration guide, onboarding process, and security specification could not be read or verified from the retrieved pages. Treat all endpoint, payload, callback, eligibility, and production-access requirements as **unverified** until checked against current official documentation and authorized sandbox access.

## Decisions required before implementation

1. Name the specific capability and user outcome required.
2. Determine whether HospitalFlow needs identity lookup/verification, account creation/linking, facility/professional registration, or health-information exchange. These are separate workflows and approvals.
3. Identify the eligible organization and its role; confirm its official onboarding and production-access status.
4. Approve the backend, authentication, database, data residency, retention, consent, audit, and incident-response approach.
5. Obtain authorized sandbox access through the official process; do not request secrets in chat or commit credentials.
6. Verify the current official API contract, test-data policy, authentication, callback authentication/replay controls, retry behavior, rate limits, and versioning.

## Proposed implementation boundary

- Use a server-side `AbdmIntegrationService`/adapter, never call privileged ABDM APIs from browser code.
- Keep sandbox and production configuration isolated. Never expose client secrets or bearer tokens in frontend environment variables.
- Validate all inbound/outbound payloads against the current official contract.
- Use explicit workflow states such as initiated, pending verification, verified, linked, failed, expired, or cancelled only where the official flow supports them. Never mark a user verified based on a client-only action.
- Do not bypass OTP or other official verification.
- Verify callback authenticity and replay protection exactly as the current official contract specifies; do not invent a signature scheme.
- Use only approved synthetic sandbox identities and data.
- Treat health-information exchange, if needed, as a separate project with its own authorization, consent, recipient, format, and audit requirements.

## Delivery gates

| Gate | Required evidence |
|---|---|
| Capability selection | Approved use case and responsible organization |
| Contract discovery | Current official, versioned API documentation and policy references |
| Sandbox readiness | Authorized enrollment and credentials stored in deployment secret management |
| Server foundation | Authenticated API, organization/resource authorization, runtime validation, safe errors, timeouts, rate limits, and audit strategy |
| Adapter tests | Contract fixtures, invalid inputs, rejected/expired callbacks, retries/timeouts, cancellation, and safe logging |
| Pilot approval | Privacy/security/legal/operations review, support procedures, monitoring, and rollback plan |
| Production access | Verified official onboarding and explicit organizational approval |

## Not implemented / not claimed

- No ABHA number is generated or verified.
- No patient identity is linked.
- No official consent is collected or represented.
- No health records are discovered or exchanged.
- No ABDM or ABHA certification, approval, or compliance is claimed.
