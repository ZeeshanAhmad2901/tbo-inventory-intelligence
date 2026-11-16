# Database Schema — Logical Foundation

## Core Entities
- Supplier
- ImportJob
- RawRecord
- SupplierProduct
- CanonicalProduct
- ProductMembership
- SupplierOffer
- MatchPair
- ReviewDecision
- AuditEvent
- EvaluationDataset
- EvaluationRun

## Important Constraints
- Unique supplier product key where source semantics allow.
- Raw records are immutable.
- Foreign keys preserve ownership and provenance.
- Product membership decisions must be auditable.
- Offer prices use Decimal/Numeric, never binary float.
- Currency and capture timestamp are explicit.
- Match decisions retain evidence, method, and version.
- Historical offers are snapshots, not overwritten current values.

## Price Comparability
Check currency, dates, occupancy, product/rate conditions,
cancellation, inclusions, taxes, fees, and availability context.
