# Deployment and Rollback

**Assessment date:** 2026-10-23

## Current deployment model

- Vite produces a static client bundle with `npm run build`.
- Vercel project: `hospital-flow`.
- Production URL: [https://hospital-flow-tau.vercel.app/](https://hospital-flow-tau.vercel.app/).
- Preview deployment for the current blood bank, ambulance, and isolation workflow changes: [https://hospital-flow-hn6w3dy2j-grutech.vercel.app/](https://hospital-flow-hn6w3dy2j-grutech.vercel.app/).
- Vercel reported the preview deployment as **READY** on 2026-10-23. This was not a production promotion. The preview deployment was protected by Vercel Authentication.
- No API functions, database, migration, or `vercel.json` runtime configuration were found in the repository.

## Deployment safety

- Treat the current app as synthetic demo content only.
- Do not place patient data or production credentials in Preview.
- Keep any future server credentials server-only; never expose them through `VITE_*` client variables.
- Do not run database migrations or promote to Production without explicit approval and a verified rollback plan.
- Check build output and deployment status before sharing a preview URL; verify protected deployments with authorized project access.

## Application rollback

For a static-only release with no database changes:

1. Identify the last known-good Production deployment in Vercel.
2. Confirm the deployment and target domain with the release owner.
3. Use Vercel's supported rollback/promote-to-production flow to restore that deployment; do not force-push Git history.
4. Verify the production domain, primary workflow routes, and deployment state.
5. Preserve the failed deployment and logs for diagnosis.

The current preview is separate from Production, so no production rollback is required for that preview.

## Future database rollback requirements

There is no production database today. Before introducing one, document migration compatibility, backup/restore verification, rollback vs. forward-fix decision, data-loss risks, schema version, and responsible approver. Do not assume application rollback automatically reverses database changes.

## Monitoring and unresolved operational requirements

No application API runtime or external error monitoring configuration was verified during this repository review. Before a sensitive-data pilot, select monitoring and alert ownership, redact logs, define incident response and on-call responsibilities, verify backups/restores, and document recovery objectives. This assessment does not assert any Vercel plan-level observability configuration.
