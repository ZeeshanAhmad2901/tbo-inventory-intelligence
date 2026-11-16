# TBO Inventory Intelligence

AI-assisted multi-supplier travel inventory matching, consolidation,
and explainable ranking.

> Development status: Architecture foundation. No production supplier
> integrations or measured accuracy claims are implied.

## Architecture
- Frontend: React + TypeScript + Vite (planned)
- API: FastAPI
- Domain/application: independent business rules and use cases
- Matching: deterministic baseline first; ML/embeddings optional
- Persistence: PostgreSQL + SQLAlchemy + Alembic
- Jobs: imports, matching, and evaluation execution

## Local Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp ../.env.example ../.env
cd ..
docker compose up -d postgres
cd backend
uvicorn tbo_inventory.main:app --reload
```

API: http://localhost:8000
Swagger: http://localhost:8000/docs
Health: http://localhost:8000/health

## Principles
1. Preserve raw supplier data and provenance.
2. Separate canonical identity, supplier listing, and offer.
3. Never merge solely on one similarity score.
4. Ambiguous identity goes to review.
5. Preserve offer snapshots and conditions.
6. Evaluate on held-out ground truth.
7. Clearly label synthetic datasets.

See docs/ for architecture, schema, matching, API, setup, and roadmap.
