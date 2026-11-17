import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUpDown,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  Info,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'

type Offer = {
  id: string
  property: string
  city: string
  supplier: string
  roomType: string
  board: string
  occupancy: string
  cancellation: string
  cancellationDeadline: string
  total: number
  taxes: number
  availability: string
  payment: string
  perks: string
}

const stay = {
  checkIn: '18 Dec 2026',
  checkOut: '21 Dec 2026',
  nights: 3,
}

const offers: Offer[] = [
  {
    id: 'MG-TRV-1042',
    property: 'The Meridian Grand',
    city: 'Mumbai, India',
    supplier: 'TravelNest',
    roomType: 'Deluxe King Room',
    board: 'Room only',
    occupancy: '2 adults',
    cancellation: 'Free cancellation',
    cancellationDeadline: 'Until 15 Dec 2026',
    total: 24840,
    taxes: 3240,
    availability: 'Available',
    payment: 'Pay at property',
    perks: 'Welcome drink',
  },
  {
    id: 'MG-ORB-2081',
    property: 'The Meridian Grand',
    city: 'Mumbai, India',
    supplier: 'OrbitRooms',
    roomType: 'Deluxe King Room',
    board: 'Room only',
    occupancy: '2 adults',
    cancellation: 'Non-refundable',
    cancellationDeadline: 'No cancellation',
    total: 22110,
    taxes: 2880,
    availability: 'Available',
    payment: 'Prepaid',
    perks: 'None',
  },
  {
    id: 'MG-STA-3316',
    property: 'The Meridian Grand',
    city: 'Mumbai, India',
    supplier: 'StayAxis',
    roomType: 'Deluxe King Room',
    board: 'Room only',
    occupancy: '2 adults',
    cancellation: 'Free cancellation',
    cancellationDeadline: 'Until 14 Dec 2026',
    total: 25990,
    taxes: 3390,
    availability: 'Available',
    payment: 'Pay at property',
    perks: 'Late checkout, subject to availability',
  },
  {
    id: 'HP-TRV-1120',
    property: 'Harbour Point Suites',
    city: 'Goa, India',
    supplier: 'TravelNest',
    roomType: 'Premium Sea View',
    board: 'Breakfast included',
    occupancy: '2 adults',
    cancellation: 'Free cancellation',
    cancellationDeadline: 'Until 15 Dec 2026',
    total: 31450,
    taxes: 4100,
    availability: 'Available',
    payment: 'Pay at property',
    perks: 'Breakfast for two',
  },
  {
    id: 'HP-ORB-2194',
    property: 'Harbour Point Suites',
    city: 'Goa, India',
    supplier: 'OrbitRooms',
    roomType: 'Premium Sea View',
    board: 'Breakfast included',
    occupancy: '2 adults',
    cancellation: 'Non-refundable',
    cancellationDeadline: 'No cancellation',
    total: 29700,
    taxes: 3870,
    availability: 'Available',
    payment: 'Prepaid',
    perks: 'Breakfast for two',
  },
  {
    id: 'HP-STA-3408',
    property: 'Harbour Point Suites',
    city: 'Goa, India',
    supplier: 'StayAxis',
    roomType: 'Premium Sea View',
    board: 'Breakfast included',
    occupancy: '2 adults',
    cancellation: 'Free cancellation',
    cancellationDeadline: 'Until 14 Dec 2026',
    total: 32980,
    taxes: 4300,
    availability: 'Available',
    payment: 'Pay at property',
    perks: 'Breakfast and airport transfer',
  },
]

const properties = [...new Set(offers.map((offer) => offer.property))]
const suppliers = [...new Set(offers.map((offer) => offer.supplier))]
const initialProperty = properties[0]
const initialSelection = offers
  .filter((offer) => offer.property === initialProperty)
  .slice(0, 2)
  .map((offer) => offer.id)

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function OffersPage() {
  const [property, setProperty] = useState(initialProperty)
  const [supplier, setSupplier] = useState('All suppliers')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelection)
  const [notice, setNotice] = useState('')

  const propertyOffers = useMemo(
    () => offers.filter((offer) => offer.property === property),
    [property],
  )

  const filteredOffers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return propertyOffers.filter((offer) => {
      const matchesSupplier = supplier === 'All suppliers' || offer.supplier === supplier
      const matchesSearch =
        !term ||
        [offer.supplier, offer.roomType, offer.board, offer.id]
          .join(' ')
          .toLowerCase()
          .includes(term)
      return matchesSupplier && matchesSearch
    })
  }, [propertyOffers, search, supplier])

  const selectedOffers = useMemo(
    () => selectedIds
      .map((id) => offers.find((offer) => offer.id === id))
      .filter((offer): offer is Offer => Boolean(offer)),
    [selectedIds],
  )

  const lowestOffer = selectedOffers.length
    ? selectedOffers.reduce((lowest, offer) => offer.total < lowest.total ? offer : lowest)
    : null

  const highestTotal = selectedOffers.length
    ? Math.max(...selectedOffers.map((offer) => offer.total))
    : 0

  function toggleOffer(id: string) {
    setNotice('')
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((selectedId) => selectedId !== id)
      }
      if (current.length >= 3) {
        setNotice('You can compare up to three offers at a time.')
        return current
      }
      return [...current, id]
    })
  }

  function changeProperty(nextProperty: string) {
    setProperty(nextProperty)
    setSupplier('All suppliers')
    setSearch('')
    setSelectedIds(
      offers.filter((offer) => offer.property === nextProperty).slice(0, 2).map((offer) => offer.id),
    )
    setNotice('')
  }

  function resetDemo() {
    setProperty(initialProperty)
    setSupplier('All suppliers')
    setSearch('')
    setSelectedIds(initialSelection)
    setNotice('Demo comparison has been reset.')
  }

  return (
    <div className="offers-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">COMMERCIAL WORKSPACE</div>
          <h1>Offer Comparison</h1>
          <p>Compare supplier rates and identify the strongest price for a like-for-like stay.</p>
        </div>
        <div className="heading-actions">
          <span className="demo-label"><span /> ILLUSTRATIVE DATA</span>
          <button className="button button-secondary" type="button" onClick={resetDemo}>
            <RotateCcw size={15} /> Reset demo
          </button>
        </div>
      </div>

      <section className="offers-stay-card" aria-label="Selected stay">
        <div className="offers-stay-property">
          <span className="offers-icon-tile"><Building2 size={19} /></span>
          <div>
            <span className="offers-field-label">PROPERTY</span>
            <strong>{property}</strong>
            <span className="offers-muted">{offers.find((offer) => offer.property === property)?.city}</span>
          </div>
        </div>
        <div className="offers-stay-meta">
          <CalendarDays size={17} />
          <div>
            <span className="offers-field-label">STAY DATES</span>
            <strong>{stay.checkIn} – {stay.checkOut}</strong>
            <span className="offers-muted">{stay.nights} nights · 2 adults</span>
          </div>
        </div>
        <label className="offers-property-select">
          <span className="offers-field-label">CHANGE PROPERTY</span>
          <select value={property} onChange={(event) => changeProperty(event.target.value)}>
            {properties.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </section>

      <section className="metrics-grid offers-metrics">
        <div className="metric-card">
          <span className="offers-metric-icon"><Building2 size={17} /></span>
          <span className="metric-label">SUPPLIER OFFERS</span>
          <strong>{propertyOffers.length}</strong>
          <span className="metric-footnote">For this property and stay</span>
        </div>
        <div className="metric-card">
          <span className="offers-metric-icon"><ArrowUpDown size={17} /></span>
          <span className="metric-label">SELECTED TO COMPARE</span>
          <strong>{selectedOffers.length}<small> / 3</small></strong>
          <span className="metric-footnote">Like-for-like comparison</span>
        </div>
        <div className="metric-card">
          <span className="offers-metric-icon"><CircleDollarSign size={17} /></span>
          <span className="metric-label">LOWEST SELECTED RATE</span>
          <strong className="offers-metric-price">{lowestOffer ? formatPrice(lowestOffer.total) : '—'}</strong>
          <span className="metric-footnote">{lowestOffer?.supplier ?? 'Select an offer to begin'}</span>
        </div>
        <div className="metric-card">
          <span className="offers-metric-icon"><Sparkles size={17} /></span>
          <span className="metric-label">PRICE SPREAD</span>
          <strong className="offers-metric-price">
            {selectedOffers.length > 1 ? formatPrice(highestTotal - (lowestOffer?.total ?? 0)) : '—'}
          </strong>
          <span className="metric-footnote">Difference across selected offers</span>
        </div>
      </section>

      <div className="offers-workspace">
        <section className="panel offers-queue-panel">
          <div className="panel-heading offers-panel-heading">
            <div>
              <span className="eyebrow">AVAILABLE RATES</span>
              <h2>Supplier offers</h2>
            </div>
            <span className="offers-count">{filteredOffers.length} offers</span>
          </div>

          <div className="offers-filters">
            <label className="offers-search">
              <Search size={16} />
              <input
                aria-label="Search offers"
                placeholder="Search supplier, room or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </label>
            <label className="offers-select-filter">
              <SlidersHorizontal size={15} />
              <select value={supplier} onChange={(event) => setSupplier(event.target.value)}>
                <option>All suppliers</option>
                {suppliers.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <div className="offers-list">
            {filteredOffers.map((offer) => {
              const selected = selectedIds.includes(offer.id)
              const isLowest = selectedOffers.length > 1 && offer.id === lowestOffer?.id
              return (
                <article className={`offers-offer-card${selected ? ' is-selected' : ''}`} key={offer.id}>
                  <div className="offers-offer-top">
                    <div>
                      <strong>{offer.supplier}</strong>
                      <span className="offers-offer-id">{offer.id}</span>
                    </div>
                    {isLowest && <span className="offers-lowest-tag"><ArrowDown size={12} /> LOWEST</span>}
                  </div>
                  <div className="offers-offer-room">{offer.roomType}</div>
                  <div className="offers-offer-details">
                    <span><BedDouble size={13} /> {offer.board}</span>
                    <span>{offer.occupancy}</span>
                  </div>
                  <div className="offers-offer-bottom">
                    <div>
                      <strong>{formatPrice(offer.total)}</strong>
                      <span>total · incl. taxes</span>
                    </div>
                    <button
                      type="button"
                      className={`offers-select-button${selected ? ' selected' : ''}`}
                      onClick={() => toggleOffer(offer.id)}
                      aria-pressed={selected}
                    >
                      {selected ? <><Check size={14} /> Selected</> : <><Plus size={14} /> Compare</>}
                    </button>
                  </div>
                </article>
              )
            })}
            {filteredOffers.length === 0 && (
              <div className="offers-empty">
                <Search size={22} />
                <strong>No matching offers</strong>
                <span>Try another supplier or search term.</span>
              </div>
            )}
          </div>
          {notice && <p className="offers-notice" role="status">{notice}</p>}
          <p className="offers-queue-hint"><Info size={13} /> Select up to three offers to compare them side by side.</p>
        </section>

        <section className="panel offers-comparison-panel">
          <div className="panel-heading offers-panel-heading">
            <div>
              <span className="eyebrow">SIDE-BY-SIDE REVIEW</span>
              <h2>Compare selected offers</h2>
            </div>
            <span className="offers-count">{selectedOffers.length} selected</span>
          </div>

          {selectedOffers.length === 0 ? (
            <div className="offers-comparison-empty">
              <ArrowUpDown size={26} />
              <strong>Your comparison is empty</strong>
              <span>Select an offer from the supplier list to get started.</span>
            </div>
          ) : (
            <>
              {lowestOffer && selectedOffers.length > 1 && (
                <div className="offers-recommendation">
                  <span className="offers-recommendation-icon"><ShieldCheck size={18} /></span>
                  <div>
                    <strong>Lowest total price: {lowestOffer.supplier}</strong>
                    <span>{formatPrice(lowestOffer.total)} for {stay.nights} nights, including listed taxes. Review cancellation terms before confirming.</span>
                  </div>
                </div>
              )}
              <div className="offers-comparison-grid" style={{ '--offer-columns': selectedOffers.length } as React.CSSProperties}>
                {selectedOffers.map((offer) => {
                  const isLowest = selectedOffers.length > 1 && offer.id === lowestOffer?.id
                  const saving = highestTotal - offer.total
                  return (
                    <article className={`offers-compare-card${isLowest ? ' is-lowest' : ''}`} key={offer.id}>
                      <div className="offers-compare-card-head">
                        <div>
                          <span className="offers-field-label">SUPPLIER</span>
                          <strong>{offer.supplier}</strong>
                        </div>
                        <button type="button" aria-label={`Remove ${offer.supplier} from comparison`} onClick={() => toggleOffer(offer.id)}>
                          <X size={15} />
                        </button>
                      </div>
                      {isLowest && <span className="offers-best-value"><Check size={12} /> BEST PRICE</span>}
                      <div className="offers-compare-price">{formatPrice(offer.total)}</div>
                      <span className="offers-compare-subtitle">Total for {stay.nights} nights</span>
                      <div className="offers-compare-saving">
                        {selectedOffers.length > 1
                          ? saving === 0 ? 'Lowest selected total' : `${formatPrice(saving)} below highest`
                          : 'Add another offer to compare'}
                      </div>
                      <div className="offers-compare-divider" />
                      <dl className="offers-compare-specs">
                        <div><dt>Room type</dt><dd>{offer.roomType}</dd></div>
                        <div><dt>Board basis</dt><dd>{offer.board}</dd></div>
                        <div><dt>Occupancy</dt><dd>{offer.occupancy}</dd></div>
                        <div><dt>Cancellation</dt><dd>{offer.cancellation}</dd></div>
                        <div><dt>Deadline</dt><dd>{offer.cancellationDeadline}</dd></div>
                        <div><dt>Taxes included</dt><dd>{formatPrice(offer.taxes)}</dd></div>
                        <div><dt>Payment</dt><dd>{offer.payment}</dd></div>
                        <div><dt>Extras</dt><dd>{offer.perks}</dd></div>
                      </dl>
                      <div className="offers-compare-total">
                        <span>Final total</span>
                        <strong>{formatPrice(offer.total)}</strong>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="demo-disclaimer offers-disclaimer">
        <Info size={15} />
        <span><strong>Demo workspace:</strong> Supplier rates, property details and availability are illustrative only. This comparison is calculated locally and is not connected to live supplier inventory or booking services. The lowest price does not necessarily represent the best overall commercial option.</span>
      </div>
    </div>
  )
}
