# API Contract — v1

## Conventions
- Business endpoints use /api/v1.
- UUID identifiers.
- UTC ISO-8601 timestamps.
- Request/response DTOs; never expose ORM objects directly.
- Consistent errors: code, message, details, request_id.
- Validated inputs and documented pagination.
- Long-running operations return job IDs.

## Planned Endpoints
POST /api/v1/imports
GET  /api/v1/imports/{job_id}
GET  /api/v1/products
GET  /api/v1/products/{product_id}
GET  /api/v1/matches/review-queue
POST /api/v1/matches/{pair_id}/decision
POST /api/v1/matching/runs
POST /api/v1/ranking/preview
POST /api/v1/evaluations/runs
GET  /api/v1/evaluations/{run_id}

These are planned contracts, not implemented endpoints yet.
