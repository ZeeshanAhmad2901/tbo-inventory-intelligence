# Implementation Roadmap

## Gate 0 — Foundation
- [x] Architecture and boundaries documented
- [x] Python package and health API
- [x] Docker PostgreSQL configuration
- [x] Initial test and CI
- [ ] Database session and migrations

## Gate 1 — Ingestion
- [ ] Supplier and import job models
- [ ] CSV parsing and schema mapping
- [ ] Validation and quarantine
- [ ] Raw record preservation
- [ ] Seeded feeds

## Gate 2 — Normalization
- [ ] Hotel supplier product schema
- [ ] Text and geo normalization
- [ ] Edge-case tests

## Gate 3 — Matching
- [ ] Candidate blocking
- [ ] Feature extraction
- [ ] Baseline decisions
- [ ] Review queue
- [ ] Group consistency and reversibility

## Gate 4 — Offers and Ranking
- [ ] Offer snapshots
- [ ] Eligibility filters
- [ ] Explainable ranking

## Gate 5 — Evaluation
- [ ] Ground-truth dataset
- [ ] Entity-level split
- [ ] Metrics and error analysis
- [ ] Review audit trail

## Gate 6 — Frontend and Demo
- [ ] Inventory workspace
- [ ] Import and job status
- [ ] Product comparison
- [ ] Review studio
- [ ] Reproducible demo
