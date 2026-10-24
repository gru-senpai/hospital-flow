# Backend integration contract (not implemented)

HospitalFlow in this repository is a browser-only prototype. The panels use its existing React stores, localStorage case/operations records, and IndexedDB room-photo store. The role selector is for interface preview only; it does not authenticate a person and cannot protect records or actions.

When a backend is connected, replace these local stores with an authenticated API while preserving the existing operational model:

- GET /api/v1/operations/overview returns bed cases, lab instruments and reservations, equipment, doctor schedules, and active alerts with source, updatedAt, and version/ETag metadata.
- GET /api/v1/housekeeping/tasks?status=active returns tasks only for confirmed room departures, including urgency, claim/assignee, checklist, timestamps, and audit history.
- POST /api/v1/housekeeping/tasks/{taskId}/claim uses an Idempotency-Key; the server atomically assigns one eligible staff member or reports a conflict.
- PATCH /api/v1/housekeeping/tasks/{taskId} accepts only housekeeping-owned fields (cleaning start and checklist). The server validates confirmed discharge/departure and appends an audit event.
- POST /api/v1/housekeeping/tasks/{taskId}/submit requires checklist completion and room-only evidence, then moves the case to coordinator review.
- POST /api/v1/housekeeping/tasks/{taskId}/reclean is coordinator-only.
- POST /api/v1/beds/{bedId}/approve-ready is coordinator-only and is the sole transition to BED_READY.
- Ward cleaning calls use POST /api/v1/operations/cleaning-calls, with idempotency and audit history.

All writes must be authenticated, authorized by server-side role and facility scope, concurrency-safe, and audited. A unique active task constraint on the discharge/bed-turnaround event prevents duplicates. Subscribe to the backend event stream or refetch on version changes so every panel sees the same updates. Until then, current-browser updates can synchronize between tabs only; they are not shared between users or devices and do not persist to production.
