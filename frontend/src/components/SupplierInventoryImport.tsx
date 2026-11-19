import { useEffect, useState } from 'react'
import { AlertCircle, ArrowUpRight, FileSpreadsheet, RefreshCw, Upload, X } from 'lucide-react'
import { apiRequest, apiUpload } from '../lib/api-client'

type Supplier = {
  id: string
  name: string
  code: string
  is_active: boolean
}

type ImportJob = {
  id: string
  supplier_id: string
  source_filename: string
  status: string
  records_received: number
  records_accepted: number
  records_rejected: number
  created_at: string | null
}

type ImportRecord = {
  id: string
  row_number: number
  external_record_key: string | null
  validation_status: string
  validation_errors: unknown[]
  payload: Record<string, unknown>
}

type ImportDetail = ImportJob & { records: ImportRecord[] }

type Props = { suppliers: Supplier[] }

function formatDate(value: string | null): string {
  if (!value) return '?'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '?'
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function SupplierInventoryImport({ suppliers }: Props) {
  const [supplierId, setSupplierId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [detail, setDetail] = useState<ImportDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    apiRequest<ImportJob[]>('/ingestion/imports')
      .then((result) => {
        if (!cancelled) setJobs(result)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load import history.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [refreshKey])

  async function submitImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supplierId || !file) {
      setError('Select a supplier and choose a CSV or XLSX file.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)
    const form = new FormData()
    form.append('supplier_id', supplierId)
    form.append('file', file)

    try {
      const result = await apiUpload<ImportJob>('/ingestion/imports', form)
      setSuccess(`Import ${result.status}: ${result.records_accepted} accepted, ${result.records_rejected} rejected.`)
      setFile(null)
      const input = document.getElementById('supplier-inventory-file') as HTMLInputElement | null
      if (input) input.value = ''
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The inventory import failed.')
    } finally {
      setUploading(false)
    }
  }

  async function showDetail(jobId: string) {
    setDetailLoading(true)
    setError(null)
    try {
      const result = await apiRequest<ImportDetail>(`/ingestion/imports/${jobId}`)
      setDetail(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load import details.')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <section className="panel" aria-label="Supplier inventory import">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">DATA INGESTION</div>
          <h2>Import supplier inventory</h2>
          <p className="page-description">Upload CSV or Excel inventory files and review validation results.</p>
        </div>
        <FileSpreadsheet size={22} aria-hidden="true" />
      </div>

      <form onSubmit={submitImport} className="inventory-import-form">
        <label>
          <span className="metric-label">Supplier</span>
          <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} required>
            <option value="">Choose a supplier</option>
            {suppliers.filter((supplier) => supplier.is_active).map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name} ({supplier.code})</option>
            ))}
          </select>
        </label>
        <label>
          <span className="metric-label">Inventory file</span>
          <input
            id="supplier-inventory-file"
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
          />
        </label>
        <button className="button button-primary" type="submit" disabled={uploading || !supplierId || !file}>
          <Upload size={15} /> {uploading ? 'Importing?' : 'Upload & validate'}
        </button>
      </form>

      <p className="metric-note">Supported formats: CSV and XLSX. Required columns: product name and product type. Maximum file size: 10 MB.</p>

      {error && <p className="error-message" role="alert"><AlertCircle size={15} /> {error}</p>}
      {success && <p className="success-message" role="status">{success}</p>}

      <div className="import-history-heading">
        <div>
          <h3>Recent imports</h3>
          <p className="metric-note">Every uploaded row is retained for audit, including rejected rows.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? <p className="metric-note">Loading import history?</p> : jobs.length === 0 ? (
        <p className="metric-note">No inventory imports yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="supplier-table">
            <thead>
              <tr><th>FILE</th><th>STATUS</th><th>RECEIVED</th><th>ACCEPTED</th><th>REJECTED</th><th>CREATED</th><th /></tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.source_filename}</td>
                  <td><span className={`status-badge status-${job.status}`}>{job.status}</span></td>
                  <td>{job.records_received}</td>
                  <td>{job.records_accepted}</td>
                  <td>{job.records_rejected}</td>
                  <td>{formatDate(job.created_at)}</td>
                  <td>
                    <button className="button button-secondary" type="button" onClick={() => void showDetail(job.id)}>
                      Details <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailLoading && <p className="metric-note">Loading import details?</p>}
      {detail && (
        <div className="import-detail">
          <div className="import-history-heading">
            <div><h3>{detail.source_filename}</h3><p className="metric-note">Validation details ? {detail.records.length} rows</p></div>
            <button className="icon-button" type="button" aria-label="Close import details" onClick={() => setDetail(null)}><X size={17} /></button>
          </div>
          <div className="table-wrap">
            <table className="supplier-table">
              <thead><tr><th>ROW</th><th>RECORD KEY</th><th>VALIDATION</th><th>ERRORS</th></tr></thead>
              <tbody>
                {detail.records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.row_number}</td>
                    <td>{record.external_record_key ?? '?'}</td>
                    <td>{record.validation_status}</td>
                    <td>{record.validation_errors.length ? record.validation_errors.map((item) => typeof item === 'string' ? item : JSON.stringify(item)).join('; ') : '?'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
