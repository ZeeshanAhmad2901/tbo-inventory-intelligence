# Development Setup

## Requirements
- Python 3.12+
- Docker Desktop
- Git
- Node.js LTS for frontend

## Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn tbo_inventory.main:app --reload
pytest
ruff check src tests

## Database
cp .env.example .env
docker compose up -d postgres

Keep real secrets in .env; never commit them.
