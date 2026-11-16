# TBO Inventory Intelligence — Architecture v1

## Architecture Style
Modular monolith with strict internal boundaries.

## Layers
1. API: FastAPI routers and HTTP DTOs.
2. Application: use cases and orchestration.
3. Domain: entities, invariants, business rules.
4. Engine: matching and ranking algorithms.
5. Infrastructure: database, storage, jobs, adapters.

## Dependency Direction
API -> Application -> Domain/Engine.
Infrastructure implements persistence and external interfaces.
Domain and matching engine must not depend on FastAPI or SQLAlchemy.

## Core Invariants
- Raw supplier records are preserved and traceable.
- Supplier products remain distinct from canonical products.
- Supplier offers remain distinct from product identity.
- Match decisions retain evidence and version information.
- Ambiguous matches enter human review.
- Membership decisions are auditable and reversible.
- Ranking filters eligibility before preference scoring.
- Price comparisons require compatible commercial conditions.

## Initial Scope
Hotels first. Activities/sightseeing follow after hotel matching,
review, and evaluation are stable.

## Architecture Decisions
- Modular monolith instead of premature microservices.
- Canonical product, supplier product, and supplier offer are separate.
- Deterministic matching baseline before ML.
- Raw data and provenance are preserved.
- Human review and evaluation are first-class capabilities.
