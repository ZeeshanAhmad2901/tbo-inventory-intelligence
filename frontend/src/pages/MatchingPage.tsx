import { useEffect, useMemo, useState } from 'react'
import { readBrowserArray, writeBrowserValue } from '../lib/browser-storage'
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
  RotateCcw,
} from 'lucide-react'

type MatchStatus = 'Needs review' | 'Matched' | 'Unmatched'

type Evidence = {
  label: string
  detail: string
  strength: 'Strong' | 'Moderate' | 'Weak'
}

type Candidate = {
  id: string
  leftSupplier: string
  leftId: string
  leftName: string
  leftAddress: string
  leftCity: string
  leftCountry: string
  leftCategory: string
  rightSupplier: string
  rightId: string
  rightName: string
  rightAddress: string
  rightCity: string
  rightCountry: string
  rightCategory: string
  confidence: number
  status: MatchStatus
  evidence: Evidence[]
}

const MATCHING_STORAGE_KEY = 'tbo.matching.candidates.v1'

function isCandidate(value: unknown): value is Candidate {
  if (!value || typeof value !== 'object') return false

  const item = value as Candidate
  const statuses: MatchStatus[] = ['Needs review', 'Matched', 'Unmatched']

  return (
    typeof item.id === 'string' &&
    typeof item.leftSupplier === 'string' &&
    typeof item.leftId === 'string' &&
    typeof item.leftName === 'string' &&
    typeof item.leftAddress === 'string' &&
    typeof item.leftCity === 'string' &&
    typeof item.leftCountry === 'string' &&
    typeof item.leftCategory === 'string' &&
    typeof item.rightSupplier === 'string' &&
    typeof item.rightId === 'string' &&
    typeof item.rightName === 'string' &&
    typeof item.rightAddress === 'string' &&
    typeof item.rightCity === 'string' &&
    typeof item.rightCountry === 'string' &&
    typeof item.rightCategory === 'string' &&
    typeof item.confidence === 'number' &&
    Number.isFinite(item.confidence) &&
    statuses.includes(item.status) &&
    Array.isArray(item.evidence) &&
    item.evidence.every((entry) =>
      entry &&
      typeof entry.label === 'string' &&
      typeof entry.detail === 'string' &&
      ['Strong', 'Moderate', 'Weak'].includes(entry.strength)
    )
  )
}

const initialCandidates: Candidate[] = [
  {
    id: 'PAIR-2048',
    leftSupplier: 'Hotelbeds',
    leftId: 'HB-GOI-20193',
    leftName: 'Azure Bay Resort & Spa',
    leftAddress: 'Candolim Beach Road',
    leftCity: 'Goa',
    leftCountry: 'India',
    leftCategory: '5 Star Resort',
    rightSupplier: 'TBO Holidays',
    rightId: 'TBO-GOI-8821',
    rightName: 'Azure Bay Beach Resort',
    rightAddress: 'Candolim Beach Rd.',
    rightCity: 'Goa',
    rightCountry: 'India',
    rightCategory: 'Beach Resort',
    confidence: 94,
    status: 'Needs review',
    evidence: [
      { label: 'Hotel name', detail: 'Strong name similarity with shared distinctive terms', strength: 'Strong' },
      { label: 'Location', detail: 'Same city and country', strength: 'Strong' },
      { label: 'Address', detail: 'Street name is consistent after abbreviation normalization', strength: 'Strong' },
      { label: 'Property category', detail: 'Both records describe a resort property', strength: 'Moderate' },
    ],
  },
  {
    id: 'PAIR-2049',
    leftSupplier: 'WebBeds',
    leftId: 'WB-SIN-12093',
    leftName: 'Parkview Suites',
    leftAddress: 'Orchard Road',
    leftCity: 'Singapore',
    leftCountry: 'Singapore',
    leftCategory: 'Serviced Apartment',
    rightSupplier: 'RateHawk',
    rightId: 'RH-SIN-33012',
    rightName: 'Park View Hotel & Suites',
    rightAddress: 'Orchard Road',
    rightCity: 'Singapore',
    rightCountry: 'Singapore',
    rightCategory: '4 Star Hotel',
    confidence: 88,
    status: 'Needs review',
    evidence: [
      { label: 'Hotel name', detail: 'Similar name tokens and word order', strength: 'Strong' },
      { label: 'Location', detail: 'Same city and country', strength: 'Strong' },
      { label: 'Address', detail: 'Street-level address agreement', strength: 'Strong' },
      { label: 'Property category', detail: 'Serviced apartment and hotel classifications differ', strength: 'Weak' },
    ],
  },
  {
    id: 'PAIR-2050',
    leftSupplier: 'Hotelbeds',
    leftId: 'HB-DXB-10482',
    leftName: 'The Grand Meridian',
    leftAddress: 'Sheikh Zayed Road',
    leftCity: 'Dubai',
    leftCountry: 'United Arab Emirates',
    leftCategory: 'Luxury Hotel',
    rightSupplier: 'WebBeds',
    rightId: 'WB-778201',
    rightName: 'Grand Meridian Dubai',
    rightAddress: 'Sheikh Zayed Road',
    rightCity: 'Dubai',
    rightCountry: 'United Arab Emirates',
    rightCategory: 'Hotel',
    confidence: 97,
    status: 'Matched',
    evidence: [
      { label: 'Hotel name', detail: 'High name similarity after normalization', strength: 'Strong' },
      { label: 'Location', detail: 'Same city and country', strength: 'Strong' },
      { label: 'Address', detail: 'Matching street address', strength: 'Strong' },
      { label: 'Property category', detail: 'Compatible hotel classifications', strength: 'Moderate' },
    ],
  },
  {
    id: 'PAIR-2051',
    leftSupplier: 'RateHawk',
    leftId: 'RH-SYD-60021',
    leftName: 'Harbour Lights Hotel',
    leftAddress: 'Darling Harbour',
    leftCity: 'Sydney',
    leftCountry: 'Australia',
    leftCategory: '4 Star Hotel',
    rightSupplier: 'WebBeds',
    rightId: 'WB-SYD-88201',
    rightName: 'Harbourlight Apartments',
    rightAddress: 'Darling Harbour',
    rightCity: 'Sydney',
    rightCountry: 'Australia',
    rightCategory: 'Serviced Apartment',
    confidence: 72,
    status: 'Needs review',
    evidence: [
      { label: 'Hotel name', detail: 'Partial name similarity; property wording differs', strength: 'Moderate' },
      { label: 'Location', detail: 'Same city and country', strength: 'Strong' },
      { label: 'Address', detail: 'Neighborhood matches but exact address is unavailable', strength: 'Moderate' },
      { label: 'Property category', detail: 'Hotel and serviced apartment classifications differ', strength: 'Weak' },
    ],
  },
  {
    id: 'PAIR-2052',
    leftSupplier: 'Hotelbeds',
    leftId: 'HB-LON-44102',
    leftName: 'Cedar Court Hotel',
    leftAddress: 'Kensington High Street',
    leftCity: 'London',
    leftCountry: 'United Kingdom',
    leftCategory: '4 Star Hotel',
    rightSupplier: 'TBO Holidays',
    rightId: 'TBO-LON-99014',
    rightName: 'Cedar Court Residence',
    rightAddress: 'Bayswater Road',
    rightCity: 'London',
    rightCountry: 'United Kingdom',
    rightCategory: 'Residence',
    confidence: 41,
    status: 'Unmatched',
    evidence: [
      { label: 'Hotel name', detail: 'Some shared name tokens, but different property wording', strength: 'Weak' },
      { label: 'Location', detail: 'Same city and country only', strength: 'Moderate' },
      { label: 'Address', detail: 'Different street addresses', strength: 'Weak' },
      { label: 'Property category', detail: 'Hotel and residence classifications differ', strength: 'Weak' },
    ],
  },
  {
    id: 'PAIR-2053',
    leftSupplier: 'WebBeds',
    leftId: 'WB-BKK-77102',
    leftName: 'Lotus Grand Palace',
    leftAddress: 'Sukhumvit Road',
    leftCity: 'Bangkok',
    leftCountry: 'Thailand',
    leftCategory: '5 Star Hotel',
    rightSupplier: 'TBO Holidays',
    rightId: 'TBO-BKK-11903',
    rightName: 'Lotus Grand Palace Bangkok',
    rightAddress: 'Sukhumvit Road',
    rightCity: 'Bangkok',
    rightCountry: 'Thailand',
    rightCategory: 'Luxury Hotel',
    confidence: 96,
    status: 'Matched',
    evidence: [
      { label: 'Hotel name', detail: 'Near-exact name match', strength: 'Strong' },
      { label: 'Location', detail: 'Same city and country', strength: 'Strong' },
      { label: 'Address', detail: 'Matching street address', strength: 'Strong' },
      { label: 'Property category', detail: 'Compatible hotel classifications', strength: 'Strong' },
    ],
  },
]

const filters: Array<'All candidates' | MatchStatus> = [
  'All candidates',
  'Needs review',
  'Matched',
  'Unmatched',
]

function statusClass(status: MatchStatus) {
  if (status === 'Matched') return 'status-connected'
  if (status === 'Needs review') return 'status-processing'
  return 'status-disconnected'
}

function confidenceClass(score: number) {
  if (score >= 90) return 'matching-confidence-high'
  if (score >= 70) return 'matching-confidence-medium'
  return 'matching-confidence-low'
}

function CandidateRecord({
  supplier,
  listingId,
  name,
  address,
  city,
  country,
  category,
}: {
  supplier: string
  listingId: string
  name: string
  address: string
  city: string
  country: string
  category: string
}) {
  return (
    <article className="matching-record">
      <div className="matching-record-top">
        <span className="matching-supplier">{supplier}</span>
        <span className="matching-listing-id">{listingId}</span>
      </div>
      <h3>{name}</h3>
      <div className="matching-record-detail">
        <MapPin size={13} />
        <span>{address}, {city}, {country}</span>
      </div>
      <div className="matching-category">{category}</div>
    </article>
  )
}

export default function MatchingPage() {
  const [candidates, setCandidates] = useState(() =>
    readBrowserArray(MATCHING_STORAGE_KEY, initialCandidates, isCandidate),
  )

  useEffect(() => {
    writeBrowserValue(MATCHING_STORAGE_KEY, candidates)
  }, [candidates])
  const [selectedId, setSelectedId] = useState(initialCandidates[0].id)
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All candidates')
  const [search, setSearch] = useState('')
  const [decisionMessage, setDecisionMessage] = useState('')

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()

    return candidates.filter((candidate) => {
      const matchesFilter =
        activeFilter === 'All candidates' || candidate.status === activeFilter
      const searchable = [
        candidate.id,
        candidate.leftName,
        candidate.rightName,
        candidate.leftSupplier,
        candidate.rightSupplier,
        candidate.leftCity,
        candidate.rightCity,
        candidate.leftId,
        candidate.rightId,
      ].join(' ').toLowerCase()

      return matchesFilter && searchable.includes(query)
    })
  }, [candidates, activeFilter, search])

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedId) ?? null

  const counts = {
    total: candidates.length,
    review: candidates.filter((candidate) => candidate.status === 'Needs review').length,
    matched: candidates.filter((candidate) => candidate.status === 'Matched').length,
    unmatched: candidates.filter((candidate) => candidate.status === 'Unmatched').length,
  }

  const updateStatus = (status: MatchStatus) => {
    if (!selectedCandidate) return

    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === selectedCandidate.id ? { ...candidate, status } : candidate,
      ),
    )
    setDecisionMessage(`${selectedCandidate.id} marked as ${status.toLowerCase()}.`)
  }

  const resetDemo = () => {
    setCandidates(initialCandidates)
    setSelectedId(initialCandidates[0].id)
    setActiveFilter('All candidates')
    setSearch('')
    setDecisionMessage('Demo decisions have been reset.')
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
          <span className="demo-label"><span /> ILLUSTRATIVE DATA</span>
          <button className="button button-secondary" onClick={resetDemo}>
            <RotateCcw size={14} /> Reset demo
          </button>
        </div>
      </div>

      <section className="metrics-grid matching-metrics" aria-label="Matching summary">
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Candidate pairs</span>
            <span className="metric-icon"><ArrowLeftRight size={17} /></span>
          </div>
          <div className="metric-value">{counts.total}</div>
          <div className="metric-foot"><span className="metric-note">Illustrative review sample</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Needs review</span>
            <span className="metric-icon"><CircleHelp size={17} /></span>
          </div>
          <div className="metric-value">{counts.review}</div>
          <div className="metric-foot"><span className="metric-note">Awaiting a decision</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Matched</span>
            <span className="metric-icon"><CheckCircle2 size={17} /></span>
          </div>
          <div className="metric-value">{counts.matched}</div>
          <div className="metric-foot"><span className="metric-note">Approved in this demo</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Unmatched</span>
            <span className="metric-icon"><ThumbsDown size={17} /></span>
          </div>
          <div className="metric-value">{counts.unmatched}</div>
          <div className="metric-foot"><span className="metric-note">Not considered the same property</span></div>
        </article>
      </section>

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
                    : filter === 'Needs review'
                      ? counts.review
                      : filter === 'Matched'
                        ? counts.matched
                        : counts.unmatched}
                </span>
              </button>
            ))}
          </div>

          <div className="matching-candidate-list">
            {filteredCandidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className={`matching-candidate ${selectedId === candidate.id ? 'matching-candidate-active' : ''}`}
                onClick={() => {
                  setSelectedId(candidate.id)
                  setDecisionMessage('')
                }}
                aria-pressed={selectedId === candidate.id}
              >
                <span className="matching-candidate-top">
                  <span className="matching-candidate-id">{candidate.id}</span>
                  <span className={`matching-score ${confidenceClass(candidate.confidence)}`}>
                    {candidate.confidence}%
                  </span>
                </span>
                <strong>{candidate.leftName}</strong>
                <span className="matching-candidate-versus">
                  <ArrowLeftRight size={12} />
                  {candidate.rightName}
                </span>
                <span className="matching-candidate-bottom">
                  <span className={`status-pill ${statusClass(candidate.status)}`}>
                    <i /> {candidate.status}
                  </span>
                  <ChevronRight size={14} />
                </span>
              </button>
            ))}
            {filteredCandidates.length === 0 && (
              <div className="matching-empty">
                No candidate pairs match your search. Try another term or filter.
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
                    <h2>{selectedCandidate.id}</h2>
                    <p>Review the supplier records and available evidence before deciding.</p>
                  </div>
                  <span className={`status-pill ${statusClass(selectedCandidate.status)}`}>
                    <i /> {selectedCandidate.status}
                  </span>
                </div>

                <div className="matching-comparison">
                  <CandidateRecord
                    supplier={selectedCandidate.leftSupplier}
                    listingId={selectedCandidate.leftId}
                    name={selectedCandidate.leftName}
                    address={selectedCandidate.leftAddress}
                    city={selectedCandidate.leftCity}
                    country={selectedCandidate.leftCountry}
                    category={selectedCandidate.leftCategory}
                  />
                  <div className="matching-connector" aria-label="Compared with">
                    <ArrowLeftRight size={18} />
                  </div>
                  <CandidateRecord
                    supplier={selectedCandidate.rightSupplier}
                    listingId={selectedCandidate.rightId}
                    name={selectedCandidate.rightName}
                    address={selectedCandidate.rightAddress}
                    city={selectedCandidate.rightCity}
                    country={selectedCandidate.rightCountry}
                    category={selectedCandidate.rightCategory}
                  />
                </div>

                <div className="matching-confidence-panel">
                  <div className="matching-confidence-top">
                    <div>
                      <span className="matching-section-label">ILLUSTRATIVE MATCH CONFIDENCE</span>
                      <p>Indicative similarity score for this example pair</p>
                    </div>
                    <strong className={confidenceClass(selectedCandidate.confidence)}>
                      {selectedCandidate.confidence}%
                    </strong>
                  </div>
                  <div
                    className="matching-confidence-track"
                    role="progressbar"
                    aria-label="Illustrative match confidence"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={selectedCandidate.confidence}
                  >
                    <span
                      className={confidenceClass(selectedCandidate.confidence)}
                      style={{ width: `${selectedCandidate.confidence}%` }}
                    />
                  </div>
                  <div className="matching-confidence-scale">
                    <span>Low similarity</span>
                    <span>High similarity</span>
                  </div>
                </div>
              </section>

              <section className="panel matching-evidence-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Matching evidence</h2>
                    <p>Signals shown here are illustrative, not generated by a live engine.</p>
                  </div>
                  <ShieldCheck size={18} className="subtle-icon" />
                </div>

                <div className="matching-evidence-list">
                  {selectedCandidate.evidence.map((item) => (
                    <div className="matching-evidence-row" key={item.label}>
                      <div className="matching-evidence-icon">
                        {item.strength === 'Strong' ? (
                          <Check size={14} />
                        ) : (
                          <CircleHelp size={14} />
                        )}
                      </div>
                      <div className="matching-evidence-copy">
                        <strong>{item.label}</strong>
                        <span>{item.detail}</span>
                      </div>
                      <span className={`matching-evidence-strength matching-strength-${item.strength.toLowerCase()}`}>
                        {item.strength}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="matching-decision-note">
                  <ShieldCheck size={16} />
                  <span>Review all available property details before approving a match. Similarity alone does not confirm property identity.</span>
                </div>
              </section>

              <section className="panel matching-actions-panel">
                <div>
                  <h2>Review decision</h2>
                  <p>Choose how this candidate pair should be classified.</p>
                </div>
                <div className="matching-action-buttons">
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => updateStatus('Matched')}
                  >
                    <CheckCircle2 size={14} /> Approve match
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => updateStatus('Unmatched')}
                  >
                    <ThumbsDown size={14} /> Reject candidate
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => updateStatus('Needs review')}
                  >
                    <CircleHelp size={14} /> Send to review
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
              <h2>No candidate selected</h2>
              <p>Choose a candidate pair from the queue to inspect the supplier records.</p>
            </section>
          )}
        </div>
      </section>

      <p className="demo-disclaimer">
        Demonstration only: candidate records, confidence scores, and evidence are illustrative examples.
        Decisions are saved in this browser on this device. They are not sent to a backend or connected to live supplier data.
      </p>
    </div>
  )
}