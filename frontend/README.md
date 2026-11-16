# TBO Inventory Intelligence - Frontend

React and TypeScript frontend for AI-assisted multi-supplier hotel inventory matching, consolidation, and explainable ranking.

## Technology

- React 19 and TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- Recharts
- Lucide React

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm

## Local Development

From the repository root:

```bash
cd frontend
npm ci
npm run dev
```

## Available Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Run TypeScript checks and create a production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## Application Sections

- Overview
- Suppliers
- Inventory
- Hotel Matching
- Review Queue
- Offer Comparison
- Analytics
- Settings

Some sections are foundation placeholders and will be implemented as the project develops.

## Data and Integration Status

Dashboard metrics and supplier records are illustrative demonstration data. They are not connected to live supplier feeds or production matching runs.

Supplier integrations, inventory ingestion, and production matching workflows are not yet represented as completed capabilities.

## Backend

The API is maintained separately in the repository's `backend/` directory. Refer to the root README and project documentation for backend setup and architecture.

## Development Principles

1. Preserve raw supplier data and provenance.
2. Separate canonical hotel identity, supplier listings, and supplier offers.
3. Never merge records solely on one similarity score.
4. Send ambiguous identity matches for human review.
5. Preserve offer snapshots and conditions.
6. Evaluate matching quality against held-out ground truth.
7. Clearly label synthetic datasets.
