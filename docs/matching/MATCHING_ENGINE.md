# Matching Engine — v1

## Pipeline
1. Validate supplier data.
2. Preserve immutable raw records.
3. Normalize text, location, and attributes.
4. Generate candidate pairs through blocking.
5. Extract similarity and contradiction features.
6. Apply deterministic baseline rules.
7. Route confident candidates, ambiguous pairs, and non-matches.
8. Resolve groups with consistency checks.
9. Persist decisions, evidence, and versions.
10. Evaluate on held-out entity-level ground truth.

## Initial Features
- Name similarity (RapidFuzz)
- Token/character similarity
- City and country agreement
- Geographic distance
- Address similarity
- Category/star/amenity consistency
- Missingness indicators
- Contradiction flags

## Decision Policy
High confidence requires multiple supporting signals and no hard contradiction.
Ambiguous cases go to review.
Low-confidence pairs remain separate.
Thresholds must be calibrated; scores are not automatically probabilities.

## False-Merge Protection
- Preserve supplier records independently.
- Keep evidence and membership history.
- Detect conflicting group attributes.
- Support unmerge/reassignment.
- Maintain hard negatives in evaluation.

## ML Progression
Rules baseline -> labeled pairs -> feature classifier -> calibration ->
optional embedding retrieval/reranking.

## Evaluation
Precision, recall, F1, false-merge rate, false-split rate,
candidate recall, latency, and error analysis.
Split by canonical entity to avoid leakage.
