import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { demoOffersDataSource, demoOffersInitialData } from '../features/offers/data-source'
import type { Offer } from '../features/offers/types'
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

const initialProperty = demoOffersInitialData.properties[0]
const initialSelection = demoOffersInitialData.offers
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
  const { data: offersData } = useQuery({
    queryKey: ['offers', 'demo'],
    queryFn: () => demoOffersDataSource.getOffers(),
    initialData: demoOffersInitialData,
  })

  const { offers, stay, properties, suppliers } = offersData
  const [property, setProperty] = useState(initialProperty)
  const [supplier, setSupplier] = useState('All suppliers')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelection)
  const [notice, setNotice] = useState('')

  const propertyOffers = useMemo(
    () => offers.filter((offer) => offer.property === property),
    [offers, property],
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
    [offers, selectedIds],
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
