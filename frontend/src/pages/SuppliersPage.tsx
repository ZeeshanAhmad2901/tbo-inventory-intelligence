import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Download,
  Link2,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { apiRequest } from '../lib/api-client'

type Supplier = {
  id: string
  code: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type SupplierStatus = 'Active' | 'Inactive'
type StatusFilter = 'All statuses' | SupplierStatus

const statusClass: Record<SupplierStatus, string> = {
  Active: 'status-connected',
  Inactive: 'status-disconnected',
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getSupplierColor(code: string): string {
  const colors = [
    'supplier-blue',
    'supplier-green',
    'supplier-purple',
    'supplier-gold',
  ]
  const hash = [...code].reduce((total, character) => total + character.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Unavailable'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All statuses')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const detailPanelRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadSuppliers = async () => {
      setLoading(true)
      setError(null)

      try {
        const records = await apiRequest<Supplier[]>('/suppliers')

        if (!cancelled) {
          setSuppliers(records)
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load suppliers. Check the API connection and try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadSuppliers()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

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
        supplier.name.toLowerCase().includes(query) ||
        supplier.code.toLowerCase().includes(query)

      const status: SupplierStatus = supplier.is_active ? 'Active' : 'Inactive'
      const matchesStatus =
        statusFilter === 'All statuses' || status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [suppliers, search, statusFilter])

  const activeCount = suppliers.filter((supplier) => supplier.is_active).length
  const inactiveCount = suppliers.length - activeCount

  const exportSuppliers = () => {
    const headers = [
      'Supplier ID',
      'Supplier Code',
      'Supplier Name',
      'Active',
      'Created At',
      'Updated At',
    ]

    const rows = filteredSuppliers.map((supplier) => [
      supplier.id,
      supplier.code,
      supplier.name,
      supplier.is_active ? 'Yes' : 'No',
      supplier.created_at,
      supplier.updated_at,
    ])

    const escapeCsv = (value: string | number) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\r\n')

    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tbo-suppliers-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="suppliers-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">INVENTORY SOURCES</div>
          <h1>Suppliers</h1>
          <p className="page-description">
            Review configured supplier records and their database status.
          </p>
        </div>

        <div className="heading-actions">
          <span className="demo-label"><span /> DATABASE-BACKED</span>
          <button
            className="button button-primary"
            disabled
            title="Supplier integration is not implemented yet"
          >
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
          <div className="metric-value">{loading ? '—' : suppliers.length}</div>
          <div className="metric-foot">
            <span className="metric-note">Persisted supplier records</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Active suppliers</span>
            <span className="metric-icon"><CheckCircle2 size={18} /></span>
          </div>
          <div className="metric-value">{loading ? '—' : activeCount}</div>
          <div className="metric-foot">
            <span className="metric-note">Enabled in the database</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Inactive suppliers</span>
            <span className="metric-icon"><AlertCircle size={18} /></span>
          </div>
          <div className="metric-value">{loading ? '—' : inactiveCount}</div>
          <div className="metric-foot">
            <span className="metric-note">Disabled in the database</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Directory source</span>
            <span className="metric-icon"><ShieldCheck size={18} /></span>
          </div>
          <div className="metric-value">API</div>
          <div className="metric-foot">
            <span className="metric-note">Read-only database records</span>
          </div>
        </article>
      </section>

      <section className="panel suppliers-directory">
        <div className="panel-heading">
          <div>
            <h2>Supplier directory</h2>
            <p>Review supplier records stored in the application database</p>
          </div>
          <div className="heading-actions">
            <span className="demo-label"><span /> DATABASE RECORDS</span>
            <button
              className="button button-secondary"
              onClick={exportSuppliers}
              disabled={loading || Boolean(error) || filteredSuppliers.length === 0}
              title="Export suppliers matching the current search and status filter"
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        <div className="supplier-toolbar">
          <label className="supplier-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search suppliers by name or code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search suppliers"
            />
          </label>

          <select
            className="supplier-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            aria-label="Filter by supplier status"
          >
            <option>All statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="supplier-table directory-table">
            <thead>
              <tr>
                <th>SUPPLIER</th>
                <th>SUPPLIER CODE</th>
                <th>STATUS</th>
                <th>LAST UPDATED</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="supplier-empty" role="status">
                    Loading supplier records...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="supplier-empty" role="alert">
                    <div>{error}</div>
                    <button
                      className="button button-secondary"
                      onClick={() => setRefreshKey((current) => current + 1)}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              )}

              {!loading && !error && filteredSuppliers.map((supplier) => {
                const status: SupplierStatus = supplier.is_active ? 'Active' : 'Inactive'

                return (
                  <tr key={supplier.id}>
                    <td>
                      <div className="supplier-name">
                        <span className={`supplier-avatar ${getSupplierColor(supplier.code)}`}>
                          {getInitials(supplier.name)}
                        </span>
                        <strong>{supplier.name}</strong>
                      </div>
                    </td>
                    <td className="table-number">{supplier.code}</td>
                    <td>
                      <span className={`status-pill ${statusClass[status]}`}>
                        <i />{status}
                      </span>
                    </td>
                    <td className="updated-cell">{formatDate(supplier.updated_at)}</td>
                    <td>
                      <button
                        className="button button-secondary supplier-view-button"
                        aria-label={`View details for ${supplier.name}`}
                        onClick={(event) => {
                          previousFocusRef.current = event.currentTarget
                          setSelectedSupplier(supplier)
                        }}
                      >
                        Details <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}

              {!loading && !error && filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="supplier-empty">
                    {suppliers.length === 0
                      ? 'No supplier records have been configured yet.'
                      : 'No suppliers match your search or selected status.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          className="supplier-table-footer"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {loading
            ? 'Loading supplier directory...'
            : error
              ? 'Supplier directory unavailable'
              : `Showing ${filteredSuppliers.length} of ${suppliers.length} suppliers`}
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
            aria-describedby="supplier-detail-description"
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
              <span className={`supplier-avatar ${getSupplierColor(selectedSupplier.code)}`}>
                {getInitials(selectedSupplier.name)}
              </span>
              <div>
                <strong>{selectedSupplier.name}</strong>
                <span>Database supplier record</span>
              </div>
            </div>

            <p id="supplier-detail-description" className="supplier-detail-description">
              Supplier information retrieved from the application database.
            </p>

            <div className="supplier-detail-row">
              <span>Supplier code</span>
              <strong>{selectedSupplier.code}</strong>
            </div>
            <div className="supplier-detail-row">
              <span>Database status</span>
              <strong
                className={`status-pill ${statusClass[selectedSupplier.is_active ? 'Active' : 'Inactive']}`}
              >
                <i />{selectedSupplier.is_active ? 'Active' : 'Inactive'}
              </strong>
            </div>
            <div className="supplier-detail-row">
              <span>Supplier ID</span>
              <strong>{selectedSupplier.id}</strong>
            </div>
            <div className="supplier-detail-row">
              <span>Created at</span>
              <strong>{formatDate(selectedSupplier.created_at)}</strong>
            </div>
            <div className="supplier-detail-row">
              <span>Last updated</span>
              <strong>{formatDate(selectedSupplier.updated_at)}</strong>
            </div>

            <div className="supplier-detail-note">
              <ShieldCheck size={17} />
              <span>
                This record confirms supplier configuration only. No live supplier
                connection, credentials, inventory synchronization, or listing
                counts are implied.
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
        Supplier records and database status are retrieved from the application API.
        Supplier connectivity and inventory synchronization are not yet implemented.
      </p>
    </div>
  )
}
