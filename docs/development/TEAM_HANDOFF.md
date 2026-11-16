# TBO Inventory Intelligence — Team Handoff

## Repository
https://github.com/ZeeshanAhmad2901/tbo-inventory-intelligence

## Current baseline
- FastAPI application with root and health endpoints
- Python src-layout package
- Pytest and Ruff configuration
- Docker Compose PostgreSQL 16
- GitHub Actions backend CI
- Architecture, data model, API contract, matching engine and roadmap documentation

## Requirements
- Python 3.12+
- Docker Desktop
- Git

## Clone
```bash
git clone https://github.com/ZeeshanAhmad2901/tbo-inventory-intelligence.git
cd tbo-inventory-intelligence
```

## Start PostgreSQL
```bash
docker compose up -d postgres
docker compose ps
docker compose exec postgres pg_isready -U tbo -d tbo_inventory
```

## Configure backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -e ".[dev]"
```

## Environment
From repository root:
```bash
cp .env.example .env
```

## Run tests and lint
From backend with virtual environment activated:
```bash
pytest
ruff check src tests
```

## Run API
```bash
python -m uvicorn tbo_inventory.main:app --reload
```

- API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

## Important
- `.env` and `.venv` are local and must not be committed.
- Do not claim supplier production integrations exist unless implemented and authorized.
- Read `docs/architecture/ARCHITECTURE.md` and `docs/roadmap/IMPLEMENTATION_ROADMAP.md` before adding modules.
