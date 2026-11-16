import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Link2,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'

type SupplierStatus = 'Connected' | 'Processing' | 'Attention' | 'Not connected'

type Supplier = {
  name: string
  initials: string
  color: string
  listings: string
  status: SupplierStatus
  updated: string
  frequency: string
  description: string
}

const suppliers: Supplier[] = [
  {
    name: 'Hotelbeds',
    initials: 'HB',
    color: 'supplier-blue',
    listings: '12,840',
    status: 'Connected',
    updated: '8 min ago',
    frequency: 'Every 30 minutes',
    description: 'Hotel inventory distribution and accommodation content.',
  },
  {
    name: 'WebBeds',
    initials: 'WB',
    color: 'supplier-green',
    listings: '9,620',
    status: 'Connected',
    updated: '24 min ago',
    frequency: 'Every hour',
    description: 'Global accommodation inventory distribution.',
  },
  {
    name: 'RateHawk',
    initials: 'RH',
    color: 'supplier-purple',
    listings: '8,410',
    status: 'Processing',
    updated: '41 min ago',
    frequency: 'Every hour',
    description: 'Hotel and accommodation inventory aggregation.',
  },
  {
    name: 'TBO Holidays',
    initials: 'TB',
    color: 'supplier-gold',
    listings: '7,772',
    status: 'Attention',
    updated: '2 hours ago',
    frequency: 'Every 30 minutes',
    description: 'Travel inventory distribution and hotel supply.',
  },
]

const statusClass: Record<SupplierStatus, string> = {
  Connected: 'status-connected',
  Processing: 'status-processing',
  Attention: 'status-attention',
  'Not connected': 'status-disconnected',
}

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const detailPanelRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!selectedSupplier) return

    const previouslyFocused = previousFocusRef.current
    const panel = detailPanelRef.current
    const closeButton = panel?.querySelector<HTMLButtonElement>(
      'button[aria-label="Close supplier details"]',
    )

    closeButton?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setSelectedSupplier(null)
        return
      }

      if (event.key !== 'Tab' || !panel) return

      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [selectedSupplier])

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.name.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All statuses' || supplier.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter])

  const connectedCount = suppliers.filter(
    (supplier) => supplier.status === 'Connected',
  ).length

  const totalListings = suppliers.reduce(
    (total, supplier) => total + Number(supplier.listings.replace(',', '')),
    0,
  )

  return (
    <div className="suppliers-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">INVENTORY SOURCES</div>
          <h1>Suppliers</h1>
          <p className="page-description">
            Manage supplier sources and monitor inventory connection health.
          </p>
        </div>

        <div className="heading-actions">
          <span className="demo-label"><span /> DEMO DATA</span>
          <button className="button button-primary" disabled title="Supplier integration is not implemented yet">
            <Link2 size={15} /> Connect supplier
          </button>
        </div>
      </div>

      <section className="metrics-grid" aria-label="Supplier summary">
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Total suppliers</span>
            <span className="metric-icon"><Building2 size={18} /></span>
          </div>
          <div className="metric-value">{suppliers.length}</div>
          <div className="metric-foot">
            <span className="metric-note">Configured demo sources</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Connected</span>
            <span className="metric-icon"><CheckCircle2 size={18} /></span>
          </div>
          <div className="metric-value">{connectedCount}</div>
          <div className="metric-foot">
            <span className="metric-note">Illustrative connection states</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Supplier listings</span>
            <span className="metric-icon"><Building2 size={18} /></span>
          </div>
          <div className="metric-value">{totalListings.toLocaleString('en-IN')}</div>
          <div className="metric-foot">
            <span className="metric-note">Illustrative inventory volume</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Needs attention</span>
            <span className="metric-icon"><AlertCircle size={18} /></span>
          </div>
          <div className="metric-value">
            {suppliers.filter((supplier) => supplier.status === 'Attention').length}
          </div>
          <div className="metric-foot">
            <span className="metric-note">Demo status only</span>
          </div>
        </article>
      </section>

      <section className="panel suppliers-directory">
        <div className="panel-heading">
          <div>
            <h2>Supplier directory</h2>
            <p>Review inventory sources and their connection information</p>
          </div>
          <span className="demo-label"><span /> ILLUSTRATIVE RECORDS</span>
        </div>

        <div className="supplier-toolbar">
          <label className="supplier-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search suppliers..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search suppliers"
            />
          </label>

          <select
            className="supplier-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by connection status"
          >
            <option>All statuses</option>
            <option>Connected</option>
            <option>Processing</option>
            <option>Attention</option>
            <option>Not connected</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="supplier-table directory-table">
            <thead>
              <tr>
                <th>SUPPLIER</th>
                <th>LISTINGS</th>
                <th>CONNECTION STATUS</th>
                <th>SYNC FREQUENCY</th>
                <th>LAST UPDATED</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.name}>
                  <td>
                    <div className="supplier-name">
                      <span className={`supplier-avatar ${supplier.color}`}>
                        {supplier.initials}
                      </span>
                      <strong>{supplier.name}</strong>
                    </div>
                  </td>
                  <td className="table-number">{supplier.listings}</td>
                  <td>
                    <span className={`status-pill ${statusClass[supplier.status]}`}>
                      <i />{supplier.status}
                    </span>
                  </td>
                  <td>{supplier.frequency}</td>
                  <td className="updated-cell">{supplier.updated}</td>
                  <td>
                    <button
                      className="button button-secondary supplier-view-button"
                      onClick={(event) => {
                        previousFocusRef.current = event.currentTarget
                        setSelectedSupplier(supplier)
                      }}
                    >
                      Details <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="supplier-empty">
                    No suppliers match your search or selected status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="supplier-table-footer">
          Showing {filteredSuppliers.length} of {suppliers.length} suppliers
        </div>
      </section>

      {selectedSupplier && (
        <div className="supplier-detail-backdrop" onClick={() => setSelectedSupplier(null)}>
          <section
            className="supplier-detail-panel"
            ref={detailPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="supplier-detail-header">
              <div>
                <div className="eyebrow">SUPPLIER INFORMATION</div>
                <h2 id="supplier-detail-title">{selectedSupplier.name}</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedSupplier(null)}
                aria-label="Close supplier details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="supplier-detail-identity">
              <span className={`supplier-avatar ${selectedSupplier.color}`}>
                {selectedSupplier.initials}
              </span>
              <div>
                <strong>{selectedSupplier.name}</strong>
                <span>Demonstration supplier record</span>
              </div>
            </div>

            <p className="supplier-detail-description">
              {selectedSupplier.description}
            </p>

            <div className="supplier-detail-row">
              <span>Connection status</span>
              <strong className={`status-pill ${statusClass[selectedSupplier.status]}`}>
                <i />{selectedSupplier.status}
              </strong>
            </div>
            <div className="supplier-detail-row">
              <span>Inventory listings</span>
              <strong>{selectedSupplier.listings}</strong>
            </div>
            <div className="supplier-detail-row">
              <span>Sync frequency</span>
              <strong>{selectedSupplier.frequency}</strong>
            </div>
            <div className="supplier-detail-row">
              <span>Last updated</span>
              <strong>{selectedSupplier.updated}</strong>
            </div>

            <div className="supplier-detail-note">
              <ShieldCheck size={17} />
              <span>
                This is illustrative information. No live supplier connection,
                credentials, or synchronization is configured.
              </span>
            </div>

            <button
              className="button button-secondary supplier-detail-close"
              onClick={() => setSelectedSupplier(null)}
            >
              Close details
            </button>
          </section>
        </div>
      )}

      <p className="demo-disclaimer">
        All supplier names, listing counts, statuses, and synchronization details
        on this page are illustrative demo data, not live supplier integrations.
      </p>
    </div>
  )
}