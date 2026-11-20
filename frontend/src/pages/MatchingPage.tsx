import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  MapPin,
  Search,
  ShieldCheck,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react'
import { apiRequest } from '../lib/api-client'

type ProductRecord = {
  id: string
  name: string
  product_type: string
  supplier_id: string
  supplier_name: string
  canonical_product_id: string | null
  city: string | null
  country: string | null
  address: string | null
  category: string | null
}

type Candidate = {
  id: string
  left: ProductRecord
  right: ProductRecord
  similarity_score: number
  evidence: string[]
  status: 'needs_review'
}

type CandidateResponse = {
  items: Candidate[]
  total: number
  returned: number
  products_considered: number
  rejected_pairs_excluded: number
  score_description: string
}

type Filter = 'All candidates' | 'High similarity' | 'Medium similarity' | 'Low similarity'

const filters: Filter[] = [
  'All candidates',
  'High similarity',
  'Medium similarity',
  'Low similarity',
]

function similarityClass(score: number) {
  if (score >= 90) return 'matching-confidence-high'
  if (score >= 70) return 'matching-confidence-medium'
  return 'matching-confidence-low'
}

function evidenceStrength(detail: string): 'Strong' | 'Moderate' | 'Weak' {
  const match = detail.match(/(\d+)%/)
  const score = match ? Number(match[1]) : 0

  if (score >= 90) return 'Strong'
  if (score >= 65) return 'Moderate'
  return 'Weak'
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function CandidateRecord({
  product,
}: {
  product: ProductRecord
}) {
  const location = [
    product.address,
    product.city,
    product.country,
  ].filter(Boolean).join(', ')

  return (
    <article className="matching-record">
      <div className="matching-record-top">
        <span className="matching-supplier">{product.supplier_name}</span>
        <span className="matching-listing-id">{product.id}</span>
      </div>
      <h3>{product.name}</h3>
      <div className="matching-record-detail">
        <MapPin size={13} />
        <span>{location || 'Location not provided'}</span>
      </div>
      <div className="matching-category">
        {product.category || product.product_type || 'Category not provided'}
      </div>
    </article>
  )
}

export default function MatchingPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [metadata, setMetadata] = useState<CandidateResponse | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<Filter>('All candidates')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [decisionMessage, setDecisionMessage] = useState('')

  const loadCandidates = useCallback(async () => {
    setError('')

    try {
      const response = await apiRequest<CandidateResponse>(
        '/matching/candidates',
      )

      setCandidates(response.items)
      setMetadata(response)

      setSelectedId((current) => {
        if (current && response.items.some((item) => item.id === current)) {
          return current
        }

        return response.items[0]?.id ?? null
      })
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadCandidates()
  }, [loadCandidates])

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()

    return candidates.filter((candidate) => {
      const score = candidate.similarity_score

      const matchesFilter =
        activeFilter === 'All candidates' ||
        (activeFilter === 'High similarity' && score >= 90) ||
        (activeFilter === 'Medium similarity' && score >= 70 && score < 90) ||
        (activeFilter === 'Low similarity' && score < 70)

      const searchable = [
        candidate.id,
        candidate.left.name,
        candidate.right.name,
        candidate.left.supplier_name,
        candidate.right.supplier_name,
        candidate.left.city,
        candidate.right.city,
        candidate.left.id,
        candidate.right.id,
      ].filter(Boolean).join(' ').toLowerCase()

      return matchesFilter && searchable.includes(query)
    })
  }, [candidates, activeFilter, search])

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedId) ?? null

  const counts = {
    total: candidates.length,
    high: candidates.filter((item) => item.similarity_score >= 90).length,
    medium: candidates.filter(
      (item) => item.similarity_score >= 70 && item.similarity_score < 90,
    ).length,
    low: candidates.filter((item) => item.similarity_score < 70).length,
  }

  const refreshCandidates = async () => {
    setIsRefreshing(true)
    await loadCandidates()
  }

  const submitDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedCandidate || isSubmitting) return

    setIsSubmitting(true)
    setDecisionMessage('')
    setError('')

    try {
      const response = await apiRequest<{
        status: string
        message: string
      }>(
        `/matching/candidates/${selectedCandidate.left.id}/${selectedCandidate.right.id}/decision`,
        {
          method: 'POST',
          body: { decision },
        },
      )

      setDecisionMessage(response.message)
      await loadCandidates()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="matching-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SUPPLIER DATA RECONCILIATION</div>
          <h1>Hotel Matching</h1>
          <p className="page-description">
            Compare supplier listings, review matching evidence, and manage candidate decisions.
          </p>
        </div>
        <div className="heading-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={refreshCandidates}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw size={14} />
            {isRefreshing ? 'Refreshing...' : 'Refresh candidates'}
          </button>
        </div>
      </div>

      <section className="metrics-grid matching-metrics" aria-label="Matching summary">
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Open candidates</span>
            <span className="metric-icon"><ArrowLeftRight size={17} /></span>
          </div>
          <div className="metric-value">{metadata?.total ?? 0}</div>
          <div className="metric-foot">
            <span className="metric-note">Returned by matching API</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">High similarity</span>
            <span className="metric-icon"><CheckCircle2 size={17} /></span>
          </div>
          <div className="metric-value">{counts.high}</div>
          <div className="metric-foot">
            <span className="metric-note">90% or higher heuristic score</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Medium similarity</span>
            <span className="metric-icon"><CircleHelp size={17} /></span>
          </div>
          <div className="metric-value">{counts.medium}</div>
          <div className="metric-foot">
            <span className="metric-note">70–89% heuristic score</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Products considered</span>
            <span className="metric-icon"><ShieldCheck size={17} /></span>
          </div>
          <div className="metric-value">{metadata?.products_considered ?? 0}</div>
          <div className="metric-foot">
            <span className="metric-note">Active supplier listings scanned</span>
          </div>
        </article>
      </section>

      {error && (
        <div className="matching-decision-feedback" role="alert">
          {error}
        </div>
      )}

      <section className="matching-workspace" aria-label="Hotel matching review workspace">
        <aside className="panel matching-queue">
          <div className="matching-queue-heading">
            <div>
              <h2>Candidate queue</h2>
              <p>Select a pair to inspect its details</p>
            </div>
            <span className="matching-queue-count">{filteredCandidates.length}</span>
          </div>

          <label className="matching-search">
            <Search size={15} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search hotels, suppliers or IDs"
              aria-label="Search candidate pairs"
            />
          </label>

          <div className="matching-filter-list" aria-label="Filter candidates">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`matching-filter ${activeFilter === filter ? 'matching-filter-active' : ''}`}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
              >
                {filter}
                <span>
                  {filter === 'All candidates'
                    ? counts.total
                    : filter === 'High similarity'
                      ? counts.high
                      : filter === 'Medium similarity'
                        ? counts.medium
                        : counts.low}
                </span>
              </button>
            ))}
          </div>

          <div className="matching-candidate-list">
            {isLoading ? (
              <div className="matching-empty">Loading supplier candidates...</div>
            ) : filteredCandidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className={`matching-candidate ${selectedCandidate?.id === candidate.id ? 'matching-candidate-active' : ''}`}
                onClick={() => {
                  setSelectedId(candidate.id)
                  setDecisionMessage('')
                }}
                aria-pressed={selectedCandidate?.id === candidate.id}
              >
                <span className="matching-candidate-top">
                  <span className="matching-candidate-id">
                    {candidate.left.id.slice(0, 8)} / {candidate.right.id.slice(0, 8)}
                  </span>
                  <span className={`matching-score ${similarityClass(candidate.similarity_score)}`}>
                    {candidate.similarity_score}%
                  </span>
                </span>
                <strong>{candidate.left.name}</strong>
                <span className="matching-candidate-versus">
                  <ArrowLeftRight size={12} />
                  {candidate.right.name}
                </span>
                <span className="matching-candidate-bottom">
                  <span className="status-pill status-processing">
                    <i /> Needs review
                  </span>
                  <ChevronRight size={14} />
                </span>
              </button>
            ))}

            {!isLoading && filteredCandidates.length === 0 && (
              <div className="matching-empty">
                {candidates.length === 0
                  ? 'No matching candidates are currently available. Import supplier listings or refresh the queue.'
                  : 'No candidate pairs match your search or selected filter.'}
              </div>
            )}
          </div>
        </aside>

        <div className="matching-detail-column">
          {selectedCandidate ? (
            <>
              <section className="panel matching-detail-panel">
                <div className="matching-detail-heading">
                  <div>
                    <div className="eyebrow">CANDIDATE COMPARISON</div>
                    <h2>Supplier listing comparison</h2>
                    <p>Review the supplier records and available evidence before deciding.</p>
                  </div>
                  <span className="status-pill status-processing">
                    <i /> Needs review
                  </span>
                </div>

                <div className="matching-comparison">
                  <CandidateRecord product={selectedCandidate.left} />
                  <div className="matching-connector" aria-label="Compared with">
                    <ArrowLeftRight size={18} />
                  </div>
                  <CandidateRecord product={selectedCandidate.right} />
                </div>

                <div className="matching-confidence-panel">
                  <div className="matching-confidence-top">
                    <div>
                      <span className="matching-section-label">HEURISTIC SIMILARITY SCORE</span>
                      <p>Calculated from the available supplier listing fields</p>
                    </div>
                    <strong className={similarityClass(selectedCandidate.similarity_score)}>
                      {selectedCandidate.similarity_score}%
                    </strong>
                  </div>
                  <div
                    className="matching-confidence-track"
                    role="progressbar"
                    aria-label="Heuristic similarity score"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={selectedCandidate.similarity_score}
                  >
                    <span
                      className={similarityClass(selectedCandidate.similarity_score)}
                      style={{ width: `${selectedCandidate.similarity_score}%` }}
                    />
                  </div>
                  <div className="matching-confidence-scale">
                    <span>Low similarity</span>
                    <span>High similarity</span>
                  </div>
                  <p className="matching-decision-note">
                    This score is a heuristic similarity measure, not a probability or confirmation that the listings represent the same property.
                  </p>
                </div>
              </section>

              <section className="panel matching-evidence-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Matching evidence</h2>
                    <p>Signals calculated from fields available in the supplier records.</p>
                  </div>
                  <ShieldCheck size={18} className="subtle-icon" />
                </div>

                <div className="matching-evidence-list">
                  {selectedCandidate.evidence.map((detail, index) => {
                    const label = detail.split(':')[0] || `Signal ${index + 1}`
                    const strength = evidenceStrength(detail)

                    return (
                      <div className="matching-evidence-row" key={`${label}-${index}`}>
                        <div className="matching-evidence-icon">
                          {strength === 'Strong' ? (
                            <Check size={14} />
                          ) : (
                            <CircleHelp size={14} />
                          )}
                        </div>
                        <div className="matching-evidence-copy">
                          <strong>{label}</strong>
                          <span>{detail}</span>
                        </div>
                        <span className={`matching-evidence-strength matching-strength-${strength.toLowerCase()}`}>
                          {strength}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="matching-decision-note">
                  <ShieldCheck size={16} />
                  <span>Review all available property details before approving a match. Similarity alone does not confirm property identity.</span>
                </div>
              </section>

              <section className="panel matching-actions-panel">
                <div>
                  <h2>Review decision</h2>
                  <p>Approve the canonical link or reject this candidate pair.</p>
                </div>
                <div className="matching-action-buttons">
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => void submitDecision('approved')}
                    disabled={isSubmitting}
                  >
                    <CheckCircle2 size={14} />
                    {isSubmitting ? 'Saving...' : 'Approve match'}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => void submitDecision('rejected')}
                    disabled={isSubmitting}
                  >
                    <ThumbsDown size={14} /> Reject candidate
                  </button>
                </div>
                {decisionMessage && (
                  <p className="matching-decision-feedback" role="status" aria-live="polite">
                    {decisionMessage}
                  </p>
                )}
              </section>
            </>
          ) : (
            <section className="panel matching-no-selection">
              <CircleHelp size={25} />
              <h2>{isLoading ? 'Loading candidates' : 'No candidate selected'}</h2>
              <p>
                {isLoading
                  ? 'Retrieving supplier listings from the backend.'
                  : 'Import supplier listings or adjust your search to find candidate pairs.'}
              </p>
            </section>
          )}
        </div>
      </section>

      <p className="demo-disclaimer">
        Candidate pairs are generated from active supplier listings. Similarity scores are heuristic signals
        for human review. Approved canonical links and rejected pairs are persisted by the backend.
      </p>
    </div>
  )
}
