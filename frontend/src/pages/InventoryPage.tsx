import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'

import { useQuery } from '@tanstack/react-query'
import { demoInventoryDataSource, demoInventoryInitialData } from '../features/inventory/data-source'
import type { Hotel, MatchStatus, SortDirection, SortKey } from '../features/inventory/types'


const statusClass: Record<MatchStatus, string> = {
  Matched: 'status-connected',
  'Needs review': 'status-processing',
  Unmatched: 'status-disconnected',
}

const pageSize = 8

export default function InventoryPage() {
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'demo'],
    queryFn: () => demoInventoryDataSource.getInventory(),
    initialData: demoInventoryInitialData,
  })
  const { hotels } = inventoryData
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('All countries')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null)
  const detailPanelRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!selectedHotel) return

    const previouslyFocused = previousFocusRef.current
    const panel = detailPanelRef.current
    const closeButton = panel?.querySelector<HTMLButtonElement>(
      'button[aria-label="Close hotel details"]',
    )

    closeButton?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setSelectedHotel(null)
        return
      }

      if (event.key !== 'Tab' || !panel) return

      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (!first || !last) {
        event.preventDefault()
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [selectedHotel])

  const filteredHotels = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = hotels.filter((hotel) => {
      const searchableText = [
        hotel.id,
        hotel.name,
        hotel.city,
        hotel.country,
        hotel.address,
        ...hotel.listings.flatMap((listing) => [
          listing.supplier,
          listing.listingId,
        ]),
      ].join(' ').toLowerCase()

      return (
        searchableText.includes(query) &&
        (countryFilter === 'All countries' || hotel.country === countryFilter) &&
        (categoryFilter === 'All categories' || hotel.category === categoryFilter) &&
        (statusFilter === 'All statuses' || hotel.status === statusFilter)
      )
    })

    const direction = sortDirection === 'asc' ? 1 : -1

    return filtered.sort((a, b) => {
      let comparison = 0

      if (sortKey === 'name') comparison = a.name.localeCompare(b.name)
      if (sortKey === 'city') comparison = a.city.localeCompare(b.city)
      if (sortKey === 'listings') comparison = a.listings.length - b.listings.length
      if (sortKey === 'status') comparison = a.status.localeCompare(b.status)

      return comparison * direction
    })
  }, [hotels, search, countryFilter, categoryFilter, statusFilter, sortKey, sortDirection])

  const totalListings = hotels.reduce(
    (total, hotel) => total + hotel.listings.length,
    0,
  )
  const matchedCount = hotels.filter((hotel) => hotel.status === 'Matched').length
  const reviewCount = hotels.filter((hotel) => hotel.status === 'Needs review').length
  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / pageSize))
  const visibleHotels = filteredHotels.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value)
    setCurrentPage(1)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown size={13} />
    return sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
  }

  return (
    <div className="inventory-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">HOTEL DATA MANAGEMENT</div>
          <h1>Hotel Inventory</h1>
          <p className="page-description">
            Explore canonical hotel profiles and their associated supplier listings.
          </p>
        </div>

        <div className="heading-actions">
          <span className="demo-label"><span /> DEMO DATA</span>
        </div>
      </div>

      <section className="metrics-grid" aria-label="Hotel inventory summary">
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Canonical hotels</span>
            <span className="metric-icon"><Building2 size={18} /></span>
          </div>
          <div className="metric-value">{hotels.length.toLocaleString('en-IN')}</div>
          <div className="metric-foot">
            <span className="metric-note">Illustrative hotel profiles</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Supplier listings</span>
            <span className="metric-icon"><ArrowUpRight size={18} /></span>
          </div>
          <div className="metric-value">{totalListings.toLocaleString('en-IN')}</div>
          <div className="metric-foot">
            <span className="metric-note">Across all demo profiles</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Matched profiles</span>
            <span className="metric-icon"><CheckCircle2 size={18} /></span>
          </div>
          <div className="metric-value">{matchedCount}</div>
          <div className="metric-foot">
            <span className="metric-note">Illustrative match states</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Needs review</span>
            <span className="metric-icon"><ShieldCheck size={18} /></span>
          </div>
          <div className="metric-value">{reviewCount}</div>
          <div className="metric-foot">
            <span className="metric-note">Demo review states only</span>
          </div>
        </article>
      </section>

      <section className="panel inventory-directory">
        <div className="panel-heading">
          <div>
            <h2>Canonical hotel directory</h2>
            <p>One hotel profile may be associated with multiple supplier records</p>
          </div>
          <span className="demo-label"><span /> ILLUSTRATIVE RECORDS</span>
        </div>

        <div className="inventory-toolbar">
          <label className="inventory-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search hotel, city, supplier or listing ID..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
              aria-label="Search hotels and supplier listings"
            />
          </label>

          <div className="inventory-filters">
            <select
              className="inventory-filter"
              value={countryFilter}
              onChange={(event) => updateFilter(setCountryFilter, event.target.value)}
              aria-label="Filter by country"
            >
              <option>All countries</option>
              {inventoryData.countries.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>

            <select
              className="inventory-filter"
              value={categoryFilter}
              onChange={(event) => updateFilter(setCategoryFilter, event.target.value)}
              aria-label="Filter by hotel category"
            >
              <option>All categories</option>
              {inventoryData.categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <select
              className="inventory-filter"
              value={statusFilter}
              onChange={(event) => updateFilter(setStatusFilter, event.target.value)}
              aria-label="Filter by match status"
            >
              <option>All statuses</option>
              <option>Matched</option>
              <option>Needs review</option>
              <option>Unmatched</option>
            </select>
          </div>
        </div>

        <div className="table-wrap inventory-table-wrap">
          <table className="supplier-table inventory-table">
            <caption className="inventory-sr-only">Canonical hotels and their supplier listing counts</caption>
            <thead>
              <tr>
                <th scope="col" aria-sort={sortKey === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    className="inventory-sort"
                    onClick={() => handleSort('name')}
                    aria-label={`Sort by hotel profile, currently ${sortKey === 'name' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'not sorted'}`}
                  >
                    HOTEL PROFILE {renderSortIcon('name')}
                  </button>
                </th>
                <th scope="col" aria-sort={sortKey === 'city' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    className="inventory-sort"
                    onClick={() => handleSort('city')}
                    aria-label={`Sort by location, currently ${sortKey === 'city' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'not sorted'}`}
                  >
                    LOCATION {renderSortIcon('city')}
                  </button>
                </th>
                <th scope="col">CATEGORY</th>
                <th scope="col" aria-sort={sortKey === 'listings' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    className="inventory-sort"
                    onClick={() => handleSort('listings')}
                    aria-label={`Sort by listings, currently ${sortKey === 'listings' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'not sorted'}`}
                  >
                    LISTINGS {renderSortIcon('listings')}
                  </button>
                </th>
                <th scope="col" aria-sort={sortKey === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    className="inventory-sort"
                    onClick={() => handleSort('status')}
                    aria-label={`Sort by match status, currently ${sortKey === 'status' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'not sorted'}`}
                  >
                    MATCH STATUS {renderSortIcon('status')}
                  </button>
                </th>
                <th scope="col">LAST UPDATED</th>
                <th scope="col"><span className="inventory-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleHotels.map((hotel) => (
                <tr key={hotel.id}>
                  <td>
                    <div className="inventory-hotel-name">
                      <strong>{hotel.name}</strong>
                      <span>{hotel.id}</span>
                    </div>
                  </td>
                  <td>
                    <div className="inventory-location">
                      <MapPin size={13} />
                      <span>{hotel.city}, {hotel.country}</span>
                    </div>
                  </td>
                  <td>{hotel.category}</td>
                  <td className="table-number">{hotel.listings.length}</td>
                  <td>
                    <span className={`status-pill ${statusClass[hotel.status]}`}>
                      <i />{hotel.status}
                    </span>
                  </td>
                  <td className="updated-cell">{hotel.updated}</td>
                  <td>
                    <button
                      className="button button-secondary inventory-view-button"
                      onClick={(event) => {
                        previousFocusRef.current = event.currentTarget
                        setSelectedHotel(hotel)
                      }}
                      aria-label={`View details for ${hotel.name}`}
                    >
                      Details <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}

              {visibleHotels.length === 0 && (
                <tr>
                  <td colSpan={7} className="inventory-empty">
                    No hotel profiles match your search or selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="inventory-table-footer">
          <span role="status" aria-live="polite" aria-atomic="true">
            Showing {filteredHotels.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {'–'}{Math.min(currentPage * pageSize, filteredHotels.length)}
            {' '}of {filteredHotels.length} hotels
          </span>
          <div className="inventory-pagination">
            <button
              className="inventory-page-button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              className="inventory-page-button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {selectedHotel && (
        <div className="inventory-detail-backdrop">
          <section
            className="inventory-detail-panel"
            ref={detailPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-detail-title"
            aria-describedby="inventory-detail-description"
          >
            <div className="inventory-detail-header">
              <div>
                <div className="eyebrow">CANONICAL HOTEL PROFILE</div>
                <h2 id="inventory-detail-title">{selectedHotel.name}</h2>
                <span className="inventory-detail-id">{selectedHotel.id}</span>
                <p id="inventory-detail-description" className="inventory-sr-only">
                  Canonical hotel profile, location, category, match status, and associated supplier listings.
                </p>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedHotel(null)}
                aria-label="Close hotel details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="inventory-detail-section">
              <div className="inventory-section-heading">
                <Building2 size={16} />
                <h3>Canonical hotel information</h3>
              </div>
              <div className="inventory-detail-row">
                <span>Hotel name</span>
                <strong>{selectedHotel.name}</strong>
              </div>
              <div className="inventory-detail-row">
                <span>Location</span>
                <strong>{selectedHotel.city}, {selectedHotel.country}</strong>
              </div>
              <div className="inventory-detail-row">
                <span>Address</span>
                <strong>{selectedHotel.address}</strong>
              </div>
              <div className="inventory-detail-row">
                <span>Category</span>
                <strong>{selectedHotel.category}</strong>
              </div>
              <div className="inventory-detail-row">
                <span>Illustrative match status</span>
                <strong className={`status-pill ${statusClass[selectedHotel.status]}`}>
                  <i />{selectedHotel.status}
                </strong>
              </div>
            </div>

            <div className="inventory-detail-section">
              <div className="inventory-section-heading">
                <Building2 size={16} />
                <h3>Associated supplier listings</h3>
                <span>{selectedHotel.listings.length}</span>
              </div>
              <p className="inventory-section-description">
                These are separate source records associated with this canonical profile.
              </p>

              <div className="inventory-listings">
                {selectedHotel.listings.map((listing) => (
                  <article className="inventory-listing-card" key={listing.listingId}>
                    <div className="inventory-listing-top">
                      <strong>{listing.supplier}</strong>
                      <span>{listing.category}</span>
                    </div>
                    <div className="inventory-listing-meta">
                      <span>Listing ID</span>
                      <strong>{listing.listingId}</strong>
                    </div>
                    <div className="inventory-listing-meta">
                      <span>Last updated</span>
                      <strong>{listing.lastUpdated}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="inventory-detail-note">
              <ShieldCheck size={17} />
              <span>
                Demonstration records only. Supplier associations and match states
                are illustrative and are not the result of a live matching process.
              </span>
            </div>

            <button
              className="button button-secondary inventory-detail-close"
              onClick={() => setSelectedHotel(null)}
            >
              Close details
            </button>
          </section>
        </div>
      )}

      <p className="demo-disclaimer">
        All hotel profiles, supplier listing IDs, associations and match statuses
        are illustrative demo data. No live supplier feeds or production matching
        engine is connected to this page.
      </p>
    </div>
  )
}
