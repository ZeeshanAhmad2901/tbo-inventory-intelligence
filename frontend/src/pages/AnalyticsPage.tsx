import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  Layers3,
  Percent,
  ShieldCheck,
  Target,
  Users,
  XCircle,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Range = '7d' | '30d' | '90d'

const rangeLabels: Record<Range, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
}

const reportData: Record<Range, {
  matched: string
  matchedChange: string
  coverage: string
  coverageChange: string
  approval: string
  approvalChange: string
  unresolved: string
  unresolvedChange: string
  activity: { period: string; matched: number; reviewed: number; inventory: number }[]
}> = {
  '7d': {
    matched: '82.4%',
    matchedChange: '+3.8%',
    coverage: '94.6%',
    coverageChange: '+1.2%',
    approval: '91.2%',
    approvalChange: '+2.4%',
    unresolved: '284',
    unresolvedChange: '-8.3%',
    activity: [
      { period: 'Mon', matched: 420, reviewed: 310, inventory: 520 },
      { period: 'Tue', matched: 560, reviewed: 390, inventory: 610 },
      { period: 'Wed', matched: 480, reviewed: 350, inventory: 570 },
      { period: 'Thu', matched: 690, reviewed: 470, inventory: 720 },
      { period: 'Fri', matched: 620, reviewed: 510, inventory: 680 },
      { period: 'Sat', matched: 780, reviewed: 590, inventory: 810 },
      { period: 'Sun', matched: 860, reviewed: 640, inventory: 900 },
    ],
  },
  '30d': {
    matched: '80.8%',
    matchedChange: '+5.2%',
    coverage: '93.8%',
    coverageChange: '+2.1%',
    approval: '89.7%',
    approvalChange: '+3.6%',
    unresolved: '312',
    unresolvedChange: '-5.1%',
    activity: [
      { period: 'Week 1', matched: 2840, reviewed: 1980, inventory: 3100 },
      { period: 'Week 2', matched: 3260, reviewed: 2240, inventory: 3480 },
      { period: 'Week 3', matched: 3010, reviewed: 2460, inventory: 3320 },
      { period: 'Week 4', matched: 3890, reviewed: 2810, inventory: 4120 },
    ],
  },
  '90d': {
    matched: '78.6%',
    matchedChange: '+7.4%',
    coverage: '92.1%',
    coverageChange: '+3.8%',
    approval: '87.9%',
    approvalChange: '+4.2%',
    unresolved: '368',
    unresolvedChange: '-2.7%',
    activity: [
      { period: 'Sep 1', matched: 8420, reviewed: 6240, inventory: 9100 },
      { period: 'Sep 2', matched: 9160, reviewed: 6820, inventory: 9840 },
      { period: 'Oct 1', matched: 10320, reviewed: 7910, inventory: 11200 },
      { period: 'Oct 2', matched: 11280, reviewed: 8640, inventory: 12100 },
      { period: 'Nov 1', matched: 12460, reviewed: 9420, inventory: 13400 },
      { period: 'Nov 2', matched: 13180, reviewed: 10120, inventory: 14200 },
    ],
  },
}

const suppliers = [
  { name: 'Hotelbeds', listings: 12840, matched: 10920, rate: 85.0, approved: 94.2, pending: 42 },
  { name: 'WebBeds', listings: 9620, matched: 7890, rate: 82.0, approved: 91.5, pending: 68 },
  { name: 'RateHawk', listings: 8410, matched: 6590, rate: 78.4, approved: 88.7, pending: 91 },
  { name: 'TBO Holidays', listings: 7772, matched: 6210, rate: 79.9, approved: 90.1, pending: 83 },
]

const qualityData = [
  { name: 'Exact match', value: 62, color: '#477C75' },
  { name: 'Probable match', value: 21, color: '#D5B77A' },
  { name: 'Manual review', value: 11, color: '#8291A3' },
  { name: 'Unmatched', value: 6, color: '#C9CFD5' },
]

const reviewData = [
  { outcome: 'Approved', count: 912, color: '#477C75' },
  { outcome: 'Rejected', count: 88, color: '#C47B70' },
  { outcome: 'Pending', count: 146, color: '#D5B77A' },
]

const numberFormat = new Intl.NumberFormat('en-US')

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d')
  const [supplierFilter, setSupplierFilter] = useState('All suppliers')

  const current = reportData[range]

  const visibleSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplierFilter === 'All suppliers' || supplier.name === supplierFilter),
    [supplierFilter],
  )

  const exportReport = () => {
    const rows = [
      ['TBO Inventory Intelligence - Analytics Report'],
      ['Reporting period', rangeLabels[range]],
      ['Supplier filter', supplierFilter],
      [],
      ['Performance metric', 'Value', 'Change'],
      ['Matching rate', current.matched, current.matchedChange],
      ['Supplier coverage', current.coverage, current.coverageChange],
      ['Review approval rate', current.approval, current.approvalChange],
      ['Unresolved listings', current.unresolved, current.unresolvedChange],
      [],
      ['Supplier', 'Listings', 'Matched listings', 'Match rate', 'Approval rate', 'Pending reviews'],
      ...visibleSuppliers.map((supplier) => [
        supplier.name,
        supplier.listings,
        supplier.matched,
        `${supplier.rate}%`,
        `${supplier.approved}%`,
        supplier.pending,
      ]),
      [],
      ['Match quality', 'Share'],
      ...qualityData.map((item) => [item.name, `${item.value}%`]),
      [],
      ['Review outcome', 'Count'],
      ...reviewData.map((item) => [item.outcome, item.count]),
      [],
      ['Note', 'Illustrative demonstration figures only. Not connected to live supplier feeds or production matching runs.'],
    ]

    const csv = rows.map((row) => row.map((value) => escapeCsv(value ?? '')).join(',')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tbo-analytics-${range}-${supplierFilter.toLowerCase().replace(/\s+/g, '-')}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const metrics = [
    { label: 'Matching rate', value: current.matched, change: current.matchedChange, positive: true, note: 'vs. previous period', icon: Target },
    { label: 'Supplier coverage', value: current.coverage, change: current.coverageChange, positive: true, note: 'of inventory sources', icon: Layers3 },
    { label: 'Review approval rate', value: current.approval, change: current.approvalChange, positive: true, note: 'vs. previous period', icon: ShieldCheck },
    { label: 'Unresolved listings', value: current.unresolved, change: current.unresolvedChange, positive: true, note: 'vs. previous period', icon: Clock3 },
  ]

  return (
    <div className="analytics-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PERFORMANCE & REPORTING</div>
          <h1>Analytics</h1>
          <p className="page-description">Understand matching performance, supplier quality, and review operations.</p>
        </div>
        <div className="heading-actions">
          <span className="demo-label"><span /> DEMO DATA</span>
          <button className="button button-primary" onClick={exportReport}>
            <Download size={16} /> Export report
          </button>
        </div>
      </div>

      <section className="analytics-toolbar" aria-label="Analytics filters">
        <div className="analytics-range-control">
          <span className="analytics-filter-label">Reporting period</span>
          <div className="analytics-range-buttons" role="group" aria-label="Select reporting period">
            {(['7d', '30d', '90d'] as Range[]).map((option) => (
              <button
                className={`analytics-range-button ${range === option ? 'active' : ''}`}
                key={option}
                onClick={() => setRange(option)}
                aria-pressed={range === option}
              >
                {option === '7d' ? '7 days' : option === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>
        <label className="analytics-supplier-filter">
          <span className="analytics-filter-label">Supplier performance</span>
          <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}>
            <option>All suppliers</option>
            {suppliers.map((supplier) => <option key={supplier.name}>{supplier.name}</option>)}
          </select>
        </label>
      </section>

      <p className="analytics-filter-note">
        Reporting period applies to the performance indicators and activity chart. Supplier selection filters the supplier performance table and exported supplier rows.
      </p>

      <section className="metrics-grid analytics-metrics" aria-label="Performance indicators">
        {metrics.map(({ label, value, change, positive, note, icon: Icon }) => (
          <article className="metric-card" key={label}>
            <div className="metric-top">
              <span className="metric-label">{label}</span>
              <span className="metric-icon"><Icon size={18} strokeWidth={1.8} /></span>
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-foot">
              <span className={`metric-change ${positive ? 'positive' : 'negative'}`}>
                {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {change}
              </span>
              <span className="metric-note">{note}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="analytics-main-grid">
        <article className="panel analytics-trend-panel">
          <div className="panel-heading">
            <div>
              <h2>Operational activity</h2>
              <p>Matching, reviews, and inventory activity · {rangeLabels[range].toLowerCase()}</p>
            </div>
            <span className="analytics-panel-icon"><Activity size={18} /></span>
          </div>
          <div className="chart-legend analytics-chart-legend">
            <span><i className="legend-dot legend-teal" /> Matched listings</span>
            <span><i className="legend-dot legend-champagne" /> Reviewed listings</span>
            <span><i className="legend-dot legend-slate" /> Inventory added</span>
          </div>
          <div className="analytics-trend-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={current.activity} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsMatchedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#477C75" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#477C75" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="analyticsReviewedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D5B77A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D5B77A" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEECE6" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#8993A0', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8993A0', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #E7E5DF', borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="matched" name="Matched listings" stroke="#477C75" strokeWidth={2.5} fill="url(#analyticsMatchedFill)" />
                <Area type="monotone" dataKey="reviewed" name="Reviewed listings" stroke="#C5A66A" strokeWidth={2.5} fill="url(#analyticsReviewedFill)" />
                <Area type="monotone" dataKey="inventory" name="Inventory added" stroke="#8291A3" strokeWidth={2} fill="none" strokeDasharray="5 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel analytics-quality-panel">
          <div className="panel-heading">
            <div>
              <h2>Match quality</h2>
              <p>Distribution by match classification</p>
            </div>
            <span className="analytics-panel-icon"><Percent size={18} /></span>
          </div>
          <div className="analytics-quality-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={qualityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={83} paddingAngle={3} stroke="none">
                  {qualityData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} contentStyle={{ border: '1px solid #E7E5DF', borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="analytics-quality-total"><strong>100%</strong><span>Classified</span></div>
          </div>
          <div className="analytics-quality-legend">
            {qualityData.map((item) => (
              <div className="analytics-quality-item" key={item.name}>
                <span><i style={{ background: item.color }} />{item.name}</span>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="analytics-lower-grid">
        <article className="panel analytics-supplier-panel">
          <div className="panel-heading">
            <div>
              <h2>Supplier performance</h2>
              <p>
                {supplierFilter === 'All suppliers'
                  ? 'Listing match rates and review outcomes across all suppliers'
                  : `Listing match rates and review outcomes for ${supplierFilter}`}
              </p>
            </div>
            <span className="analytics-panel-icon"><Users size={18} /></span>
          </div>
          <div className="table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>SUPPLIER</th>
                  <th>LISTINGS</th>
                  <th>MATCH RATE</th>
                  <th>APPROVAL</th>
                  <th>PENDING</th>
                </tr>
              </thead>
              <tbody>
                {visibleSuppliers.map((supplier) => (
                  <tr key={supplier.name}>
                    <td><strong>{supplier.name}</strong></td>
                    <td className="table-number">{numberFormat.format(supplier.listings)}</td>
                    <td>
                      <div className="analytics-rate-cell">
                        <strong>{supplier.rate.toFixed(1)}%</strong>
                        <span className="analytics-mini-track"><i style={{ width: `${supplier.rate}%` }} /></span>
                      </div>
                    </td>
                    <td className="table-number">{supplier.approved.toFixed(1)}%</td>
                    <td className="table-number">{supplier.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleSuppliers.length === 0 && <p className="analytics-empty">No supplier data available for this selection.</p>}
        </article>

        <article className="panel analytics-review-panel">
          <div className="panel-heading">
            <div>
              <h2>Review outcomes</h2>
              <p>Illustrative review queue breakdown</p>
            </div>
            <span className="analytics-panel-icon"><CheckCircle2 size={18} /></span>
          </div>
          <div className="analytics-review-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviewData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid stroke="#EEECE6" strokeDasharray="3 4" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#8993A0', fontSize: 11 }} />
                <YAxis type="category" dataKey="outcome" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} width={68} />
                <Tooltip contentStyle={{ border: '1px solid #E7E5DF', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="count" name="Reviews" radius={[0, 5, 5, 0]} barSize={18}>
                  {reviewData.map((entry) => <Cell key={entry.outcome} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="analytics-review-summary">
            <div><CheckCircle2 size={15} /><span>Approved</span><strong>912</strong></div>
            <div><XCircle size={15} /><span>Rejected</span><strong>88</strong></div>
            <div><Clock3 size={15} /><span>Pending</span><strong>146</strong></div>
          </div>
        </article>
      </section>

      <p className="demo-disclaimer">Illustrative demonstration figures only. These reports are not connected to live supplier feeds, production matching runs, or review records. Filters and CSV export operate on the sample data shown here.</p>
    </div>
  )
}
