import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Clock3,
  FilePenLine,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  ThumbsDown,
  UserRound,
} from 'lucide-react'

type ReviewStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Correction requested'
  | 'Deferred'

type EvidenceStrength = 'Strong' | 'Moderate' | 'Weak'

type Evidence = {
  label: string
  detail: string
  strength: EvidenceStrength
}

type HotelRecord = {
  supplier: string
  listingId: string
  name: string
  address: string
  city: string
  country: string
  category: string
}

type ReviewCase = {
  id: string
  priority: 'High' | 'Medium' | 'Low'
  confidence: number
  submitted: string
  reason: string
  left: HotelRecord
  right: HotelRecord
  evidence: Evidence[]
  status: ReviewStatus
  history: {
    action: string
    date: string
    reviewer: string
  }[]
}

const initialCases: ReviewCase[] = [
  {
    id: 'REV-3108',
    priority: 'High',
    confidence: 94,
    submitted: 'Today, 10:42 AM',
    reason: 'Address variation',
    left: {
      supplier: 'Atlas Travel',
      listingId: 'ATL-88214',
      name: 'Azure Bay Resort & Spa',
      address: '12 Coastal Road, Palm District',
      city: 'Dubai',
      country: 'United Arab Emirates',
      category: '5-star Resort',
    },
    right: {
      supplier: 'Northstar Holidays',
      listingId: 'NSH-20491',
      name: 'Azure Bay Beach Resort',
      address: '12 Coast Road, Palm Jumeirah',
      city: 'Dubai',
      country: 'United Arab Emirates',
      category: 'Luxury Hotel',
    },
    evidence: [
      { label: 'Property name', detail: 'Very similar property names with shared distinctive terms.', strength: 'Strong' },
      { label: 'Address', detail: 'Street number matches; street and district naming differ.', strength: 'Moderate' },
      { label: 'Location', detail: 'Both listings resolve to the same city and district.', strength: 'Strong' },
      { label: 'Category', detail: 'Both suppliers classify the property as an upscale resort.', strength: 'Moderate' },
    ],
    status: 'Pending',
    history: [
      { action: 'Automatically flagged for human review', date: 'Today, 10:42 AM', reviewer: 'Matching engine' },
    ],
  },
  {
    id: 'REV-3109',
    priority: 'High',
    confidence: 88,
    submitted: 'Today, 9:18 AM',
    reason: 'Name similarity',
    left: {
      supplier: 'Atlas Travel',
      listingId: 'ATL-77103',
      name: 'Parkview Suites',
      address: '48 Riverside Avenue',
      city: 'Singapore',
      country: 'Singapore',
      category: 'Serviced Apartment',
    },
    right: {
      supplier: 'Meridian Connect',
      listingId: 'MRC-44910',
      name: 'Park View Hotel & Suites',
      address: '48 River Valley Road',
      city: 'Singapore',
      country: 'Singapore',
      category: '4-star Hotel',
    },
    evidence: [
      { label: 'Property name', detail: 'High lexical similarity, but property type wording differs.', strength: 'Strong' },
      { label: 'Address', detail: 'Street number is shared; street names require verification.', strength: 'Weak' },
      { label: 'Location', detail: 'Both records are in Singapore.', strength: 'Moderate' },
      { label: 'Category', detail: 'Serviced apartment and hotel classifications differ.', strength: 'Weak' },
    ],
    status: 'Pending',
    history: [
      { action: 'Automatically flagged for human review', date: 'Today, 9:18 AM', reviewer: 'Matching engine' },
    ],
  },
  {
    id: 'REV-3110',
    priority: 'Medium',
    confidence: 72,
    submitted: 'Yesterday, 4:36 PM',
    reason: 'Property type mismatch',
    left: {
      supplier: 'Northstar Holidays',
      listingId: 'NSH-18304',
      name: 'Harbour Lights Hotel',
      address: '7 Marina Walk',
      city: 'Singapore',
      country: 'Singapore',
      category: 'Boutique Hotel',
    },
    right: {
      supplier: 'GlobalBeds',
      listingId: 'GLB-90331',
      name: 'Harbourlight Apartments',
      address: '9 Marina Walk',
      city: 'Singapore',
      country: 'Singapore',
      category: 'Serviced Apartment',
    },
    evidence: [
      { label: 'Property name', detail: 'Similar wording, but not an exact property name.', strength: 'Moderate' },
      { label: 'Address', detail: 'Building numbers differ.', strength: 'Weak' },
      { label: 'Location', detail: 'Both properties are listed in the Marina area.', strength: 'Moderate' },
      { label: 'Category', detail: 'Hotel and serviced apartment classifications differ.', strength: 'Weak' },
    ],
    status: 'Pending',
    history: [
      { action: 'Automatically flagged for human review', date: 'Yesterday, 4:36 PM', reviewer: 'Matching engine' },
    ],
  },
  {
    id: 'REV-3111',
    priority: 'Medium',
    confidence: 81,
    submitted: 'Yesterday, 2:05 PM',
    reason: 'Incomplete supplier details',
    left: {
      supplier: 'Meridian Connect',
      listingId: 'MRC-11028',
      name: 'Cedar Court Hotel',
      address: '22 Garden Street',
      city: 'London',
      country: 'United Kingdom',
      category: '3-star Hotel',
    },
    right: {
      supplier: 'GlobalBeds',
      listingId: 'GLB-67109',
      name: 'Cedar Court Residence',
      address: '22 Garden Street',
      city: 'London',
      country: 'United Kingdom',
      category: 'Residence',
    },
    evidence: [
      { label: 'Property name', detail: 'Shared distinctive name with a different property suffix.', strength: 'Moderate' },
      { label: 'Address', detail: 'Both records report the same street address.', strength: 'Strong' },
      { label: 'Location', detail: 'City and country match.', strength: 'Strong' },
      { label: 'Category', detail: 'Hotel and residence classifications are not identical.', strength: 'Weak' },
    ],
    status: 'Pending',
    history: [
      { action: 'Automatically flagged for human review', date: 'Yesterday, 2:05 PM', reviewer: 'Matching engine' },
    ],
  },
  {
    id: 'REV-3112',
    priority: 'Low',
    confidence: 96,
    submitted: 'Nov 15, 11:24 AM',
    reason: 'Duplicate listing confirmation',
    left: {
      supplier: 'Atlas Travel',
      listingId: 'ATL-41008',
      name: 'Lotus Grand Palace',
      address: '88 Sukhumvit Road',
      city: 'Bangkok',
      country: 'Thailand',
      category: '5-star Hotel',
    },
    right: {
      supplier: 'Northstar Holidays',
      listingId: 'NSH-51880',
      name: 'Lotus Grand Palace Bangkok',
      address: '88 Sukhumvit Road',
      city: 'Bangkok',
      country: 'Thailand',
      category: 'Luxury Hotel',
    },
    evidence: [
      { label: 'Property name', detail: 'Near-identical names with a geographic suffix.', strength: 'Strong' },
      { label: 'Address', detail: 'Street address matches exactly.', strength: 'Strong' },
      { label: 'Location', detail: 'City and country match exactly.', strength: 'Strong' },
      { label: 'Category', detail: 'Both suppliers classify the listing as a luxury hotel.', strength: 'Strong' },
    ],
    status: 'Pending',
    history: [
      { action: 'Automatically flagged for human review', date: 'Nov 15, 11:24 AM', reviewer: 'Matching engine' },
    ],
  },
  {
    id: 'REV-3113',
    priority: 'Low',
    confidence: 64,
    submitted: 'Nov 14, 3:50 PM',
    reason: 'Conflicting location data',
    left: {
      supplier: 'GlobalBeds',
      listingId: 'GLB-22041',
      name: 'The Meridian Grand',
      address: '5 Central Boulevard',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
      category: 'Business Hotel',
    },
    right: {
      supplier: 'Meridian Connect',
      listingId: 'MRC-77402',
      name: 'Meridian Grand Hotel',
      address: '5 Central Avenue',
      city: 'Johor Bahru',
      country: 'Malaysia',
      category: '4-star Hotel',
    },
    evidence: [
      { label: 'Property name', detail: 'Names are similar but not conclusive.', strength: 'Moderate' },
      { label: 'Address', detail: 'Street names differ.', strength: 'Weak' },
      { label: 'Location', detail: 'The listed cities are different.', strength: 'Weak' },
      { label: 'Category', detail: 'Both are classified as business-oriented hotels.', strength: 'Moderate' },
    ],
    status: 'Pending',
    history: [
      { action: 'Automatically flagged for human review', date: 'Nov 14, 3:50 PM', reviewer: 'Matching engine' },
    ],
  },
]

const statusFilters = ['All cases', 'Pending', 'Approved', 'Rejected', 'Correction requested', 'Deferred'] as const

function formatStatus(status: ReviewStatus) {
  return status.toLowerCase().replace(/\s+/g, '-')
}

function RecordCard({
  record,
  side,
}: {
  record: HotelRecord
  side: 'left' | 'right'
}) {
  return (
    <div className="review-record">
      <div className="review-record-top">
        <span className="review-record-supplier">{record.supplier}</span>
        <span className="review-record-id">{record.listingId}</span>
      </div>
      <div className="review-record-name">{record.name}</div>
      <div className="review-record-detail">
        <MapPin size={13} />
        <span>{record.address}</span>
      </div>
      <div className="review-record-detail">
        <MapPin size={13} />
        <span>{record.city}, {record.country}</span>
      </div>
      <div className="review-record-category">{record.category}</div>
      <span className="review-record-side">{side === 'left' ? 'SOURCE RECORD A' : 'SOURCE RECORD B'}</span>
    </div>
  )
}

export default function ReviewPage() {
  const [cases, setCases] = useState<ReviewCase[]>(initialCases)
  const [selectedId, setSelectedId] = useState(initialCases[0].id)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>('All cases')
  const [notice, setNotice] = useState('')

  const selectedCase = cases.find((item) => item.id === selectedId) ?? cases[0]

  const counts = useMemo(() => ({
    pending: cases.filter((item) => item.status === 'Pending').length,
    approved: cases.filter((item) => item.status === 'Approved').length,
    rejected: cases.filter((item) => item.status === 'Rejected').length,
    corrections: cases.filter((item) => item.status === 'Correction requested').length,
    deferred: cases.filter((item) => item.status === 'Deferred').length,
  }), [cases])

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase()

    return cases.filter((item) => {
      const matchesFilter = filter === 'All cases' || item.status === filter
      const searchable = [
        item.id,
        item.left.name,
        item.right.name,
        item.left.supplier,
        item.right.supplier,
        item.left.city,
        item.right.city,
      ].join(' ').toLowerCase()

      return matchesFilter && (!term || searchable.includes(term))
    })
  }, [cases, filter, search])

  function decide(status: ReviewStatus) {
    if (!selectedCase) return

    const actionLabels: Record<ReviewStatus, string> = {
      Pending: 'Reopened review',
      Approved: 'Approved as a match',
      Rejected: 'Rejected as a match',
      'Correction requested': 'Requested supplier correction',
      Deferred: 'Deferred for later review',
    }

    const now = new Date().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

    setCases((current) => current.map((item) => item.id === selectedCase.id
      ? {
          ...item,
          status,
          history: [
            { action: actionLabels[status], date: now, reviewer: 'You' },
            ...item.history,
          ],
        }
      : item,
    ))

    setNotice(`${selectedCase.id}: ${actionLabels[status]}.`)
  }

  function resetDemo() {
    setCases(initialCases)
    setSelectedId(initialCases[0].id)
    setFilter('All cases')
    setSearch('')
    setNotice('Demo review data has been reset.')
  }

  return (
    <div className="review-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">QUALITY CONTROL / HUMAN REVIEW</div>
          <h1>Human Review</h1>
          <p className="page-description">
            Inspect uncertain hotel matches, resolve discrepancies and record review decisions.
          </p>
        </div>
        <div className="heading-actions">
          <span className="demo-label"><span /> DEMO DATA</span>
          <button className="button button-secondary" onClick={resetDemo}>
            <RotateCcw size={13} /> Reset demo
          </button>
        </div>
      </div>

      <div className="review-metrics">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Awaiting review</span>
            <span className="metric-icon"><Clock3 size={16} /></span>
          </div>
          <div className="metric-value">{counts.pending}</div>
          <div className="metric-foot">Cases requiring a decision</div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Approved</span>
            <span className="metric-icon"><CheckCircle2 size={16} /></span>
          </div>
          <div className="metric-value">{counts.approved}</div>
          <div className="metric-foot">Confirmed matching records</div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Rejected</span>
            <span className="metric-icon"><ThumbsDown size={16} /></span>
          </div>
          <div className="metric-value">{counts.rejected}</div>
          <div className="metric-foot">Confirmed separate properties</div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Needs follow-up</span>
            <span className="metric-icon"><FilePenLine size={16} /></span>
          </div>
          <div className="metric-value">{counts.corrections + counts.deferred}</div>
          <div className="metric-foot">Corrections and deferred cases</div>
        </div>
      </div>

      {notice && (
        <div className="review-notice" role="status">
          <CheckCircle2 size={15} />
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss notification">×</button>
        </div>
      )}

      <div className="review-workspace">
        <section className="panel review-queue-panel">
          <div className="panel-heading">
            <div>
              <h2>Review queue</h2>
              <p>{filteredCases.length} of {cases.length} cases</p>
            </div>
            <span className="review-queue-total">{counts.pending} pending</span>
          </div>

          <div className="review-search">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cases, hotels, suppliers..."
              aria-label="Search review cases"
            />
          </div>

          <div className="review-filter">
            <label htmlFor="review-status-filter">STATUS</label>
            <select
              id="review-status-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as (typeof statusFilters)[number])}
            >
              {statusFilters.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="review-case-list">
            {filteredCases.map((item) => (
              <button
                key={item.id}
                className={`review-case-item ${selectedId === item.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedId(item.id)
                  setNotice('')
                }}
              >
                <div className="review-case-item-top">
                  <span className="review-case-id">{item.id}</span>
                  <span className={`review-priority priority-${item.priority.toLowerCase()}`}>
                    {item.priority}
                  </span>
                </div>
                <div className="review-case-names">
                  <span>{item.left.name}</span>
                  <ArrowLeftRight size={12} />
                  <span>{item.right.name}</span>
                </div>
                <div className="review-case-meta">
                  <span>{item.reason}</span>
                  <span>{item.confidence}% confidence</span>
                </div>
                <div className="review-case-bottom">
                  <span className={`review-status status-${formatStatus(item.status)}`}>
                    {item.status}
                  </span>
                  <span>{item.submitted}</span>
                </div>
              </button>
            ))}

            {filteredCases.length === 0 && (
              <div className="review-empty">
                <Search size={20} />
                <strong>No cases found</strong>
                <span>Try changing the search term or status filter.</span>
              </div>
            )}
          </div>
        </section>

        {selectedCase ? (
          <section className="review-detail-column">
            <div className="panel review-detail-panel">
              <div className="review-detail-heading">
                <div>
                  <div className="review-detail-kicker">
                    <span>{selectedCase.id}</span>
                    <span className={`review-status status-${formatStatus(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                  </div>
                  <h2>Match verification</h2>
                  <p>Compare both supplier records before making a decision.</p>
                </div>
                <div className="review-confidence">
                  <span>MODEL CONFIDENCE</span>
                  <strong>{selectedCase.confidence}%</strong>
                </div>
              </div>

              <div className="review-section-heading">
                <div>
                  <h3>Supplier record comparison</h3>
                  <p>Review the source information side by side.</p>
                </div>
                <ArrowLeftRight size={16} />
              </div>

              <div className="review-record-grid">
                <RecordCard record={selectedCase.left} side="left" />
                <RecordCard record={selectedCase.right} side="right" />
              </div>

              <div className="review-section-heading review-evidence-heading">
                <div>
                  <h3>Matching evidence</h3>
                  <p>Signals used to generate this candidate match.</p>
                </div>
                <ShieldCheck size={16} />
              </div>

              <div className="review-evidence-list">
                {selectedCase.evidence.map((item) => (
                  <div className="review-evidence-row" key={item.label}>
                    <div className="review-evidence-main">
                      <strong>{item.label}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <span className={`review-strength strength-${item.strength.toLowerCase()}`}>
                      {item.strength}
                    </span>
                  </div>
                ))}
              </div>

              <div className="review-reason">
                <AlertCircle size={15} />
                <div>
                  <strong>Reason for review</strong>
                  <span>{selectedCase.reason}. This case was routed to a reviewer because the automated match requires additional verification.</span>
                </div>
              </div>

              <div className="review-decision">
                <div>
                  <h3>Review decision</h3>
                  <p>Choose the appropriate outcome for these two records.</p>
                </div>
                <div className="review-decision-actions">
                  <button
                    className="button button-primary"
                    onClick={() => decide('Approved')}
                    disabled={selectedCase.status === 'Approved'}
                  >
                    <Check size={14} /> Approve match
                  </button>
                  <button
                    className="button button-secondary review-reject-button"
                    onClick={() => decide('Rejected')}
                    disabled={selectedCase.status === 'Rejected'}
                  >
                    <ThumbsDown size={13} /> Reject match
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => decide('Correction requested')}
                    disabled={selectedCase.status === 'Correction requested'}
                  >
                    <FilePenLine size={13} /> Request correction
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => decide('Deferred')}
                    disabled={selectedCase.status === 'Deferred'}
                  >
                    <Clock3 size={13} /> Defer
                  </button>
                </div>
                {selectedCase.status !== 'Pending' && (
                  <button className="review-reopen" onClick={() => decide('Pending')}>
                    Reopen this case
                  </button>
                )}
              </div>
            </div>

            <div className="panel review-history-panel">
              <div className="panel-heading">
                <div>
                  <h2>Review history</h2>
                  <p>Activity recorded for {selectedCase.id}</p>
                </div>
                <Clock3 size={16} />
              </div>
              <div className="review-history-list">
                {selectedCase.history.map((entry, index) => (
                  <div className="review-history-item" key={`${entry.date}-${index}`}>
                    <span className={`review-history-marker ${index === 0 ? 'current' : ''}`}>
                      {index === 0 ? <CheckCircle2 size={13} /> : <Clock3 size={12} />}
                    </span>
                    <div>
                      <strong>{entry.action}</strong>
                      <span><UserRound size={11} /> {entry.reviewer} <i /> {entry.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <div className="panel review-no-selection">
            <Search size={22} />
            <strong>Select a review case</strong>
            <span>Choose a case from the queue to inspect its records and evidence.</span>
          </div>
        )}
      </div>

      <p className="demo-disclaimer">
        Demonstration workspace. Review decisions and history are stored locally in this session and are not sent to a backend service.
      </p>
    </div>
  )
}