# Testing and Verification

**Assessment date:** 2026-10-23

## Existing verification

| Check | Result |
|---|---|
| `npm run build` | Passed: TypeScript project build and Vite production build |
| `npm run lint` | Exited successfully with React compiler/hooks warnings, including warnings in existing files |
| Test script | None configured in `package.json` |
| Test files | None found under `src/` |
| ABDM contract tests | Not applicable; no integration exists |
| Firebase rules emulator | Not completed; local emulator startup did not finish |
| Live Firebase account and workflow tests | Not run; no cloud test account configured |

The current lint warnings include:

- `src/components/CaseList.tsx`: `Date.now()` in render.
- `src/context/HospitalFlowContext.tsx`: non-component export in a component module.
- `src/components/CaseDetail.tsx`: two `Date.now()` purity warnings and one missing effect dependency.

The current Firebase-related changes also trigger Fast Refresh, state-in-effect, and React Compiler dependency warnings. No lint warning is configured as an error.

## Recommended testing foundation

Select and install a test runner only as part of a scoped test-infrastructure change. Avoid dependency upgrades unrelated to that scope.

### Unit tests

- Runtime request and persisted-data schema validation.
- Identifier normalization and external/internal ID separation.
- Authorization decisions and tenant/resource scoping.
- Consent/workflow state transitions.
- Safe error normalization and redaction.
- Data-minimization rules.

### API/database integration tests

- Anonymous access to protected endpoints is rejected.
- Cross-patient and cross-facility access is denied.
- Malformed, oversized, and excessive requests are rejected.
- DB constraints, migrations, rollback, and row-level access controls behave as designed.
- Retention, correction, export, deletion, backup, and restore flows follow approved policy.

### ABDM adapter tests

Only after official contracts and authorized sandbox access are available: valid and invalid responses, error normalization, timeouts, bounded retry behavior, cancellation/expiry, duplicate identity linking, untrusted/replayed callback rejection, and no sensitive values in logs.

### Deployment verification

- Preview is isolated from production credentials and data.
- Build output and deployed routes match the tested commit.
- Security headers and API access controls are verified on the relevant server routes.
- Monitor logs and runtime health without logging patient identifiers or clinical payloads.

No security or production readiness claim follows from a successful frontend build alone.
