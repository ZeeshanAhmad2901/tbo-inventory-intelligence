import { Link } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Plus,
  Upload,
} from 'lucide-react'
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts'

const metrics = [
  { label: 'Canonical hotels', value: '12,480', change: '+8.2%', direction: 'up', impact: 'positive', note: 'vs. previous period', icon: Building2 },
  { label: 'Supplier listings', value: '38,642', change: '+12.6%', direction: 'up', impact: 'positive', note: 'vs. previous period', icon: Upload },
  { label: 'Matched listings', value: '31,208', change: '+6.4%', direction: 'up', impact: 'positive', note: 'vs. previous period', icon: CheckCircle2 },
  { label: 'Pending reviews', value: '284', change: '-3.1%', direction: 'down', impact: 'positive', note: 'vs. previous period', icon: Clock3 },
]

const chartData = [
  { day: 'Mon', matched: 420, reviewed: 310 },
  { day: 'Tue', matched: 560, reviewed: 390 },
  { day: 'Wed', matched: 480, reviewed: 350 },
  { day: 'Thu', matched: 690, reviewed: 470 },
  { day: 'Fri', matched: 620, reviewed: 510 },
  { day: 'Sat', matched: 780, reviewed: 590 },
  { day: 'Sun', matched: 860, reviewed: 640 },
]

const suppliers = [
  { name: 'Hotelbeds', initials: 'HB', color: 'supplier-blue', listings: '12,840', status: 'Connected', updated: '8 min ago' },
  { name: 'WebBeds', initials: 'WB', color: 'supplier-green', listings: '9,620', status: 'Connected', updated: '24 min ago' },
  { name: 'RateHawk', initials: 'RH', color: 'supplier-purple', listings: '8,410', status: 'Processing', updated: '41 min ago' },
  { name: 'TBO Holidays', initials: 'TB', color: 'supplier-gold', listings: '7,772', status: 'Connected', updated: '1 hr ago' },
]

export default function OverviewPage() {
  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">INTELLIGENCE OVERVIEW</div>
          <h1>Your inventory at a glance</h1>
          <p className="page-description">Here's what's happening across your hotel inventory.</p>
        </div>
        <div className="heading-actions">
          <span className="demo-label"><span /> DEMO DATA</span>
          <button className="button button-secondary" disabled title="Inventory import is not available yet"><Upload size={16} /> Import inventory</button>
          <button className="button button-primary" disabled title="Matching runs are not available yet"><Plus size={17} /> New matching run</button>
        </div>
      </div>

      <section className="metrics-grid" aria-label="Inventory summary">
        {metrics.map(({ label, value, change, direction, impact, note, icon: Icon }) => (
          <article className="metric-card" key={label}>
            <div className="metric-top">
              <span className="metric-label">{label}</span>
              <span className="metric-icon"><Icon size={18} strokeWidth={1.8} /></span>
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-foot">
              <span className={`metric-change ${impact === 'positive' ? 'positive' : 'negative'}`}>
                {direction === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {change}
              </span>
              <span className="metric-note">{note}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Matching activity</h2>
              <p>Listing matches and reviews over the last 7 days</p>
            </div>
            <button className="select-button" disabled title="Date range selection is not available yet">Last 7 days <MoreHorizontal size={17} /></button>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot legend-teal" /> Matched listings</span>
            <span><i className="legend-dot legend-champagne" /> Reviewed listings</span>
          </div>
          <div className="activity-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="matchedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#477C75" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#477C75" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="reviewedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D5B77A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D5B77A" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEECE6" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8993A0', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8993A0', fontSize: 12 }} />
                <Tooltip contentStyle={{ border: '1px solid #E7E5DF', borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="matched" name="Matched" stroke="#477C75" strokeWidth={2.5} fill="url(#matchedFill)" />
                <Area type="monotone" dataKey="reviewed" name="Reviewed" stroke="#C5A66A" strokeWidth={2.5} fill="url(#reviewedFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel distribution-panel">
          <div className="panel-heading">
            <div>
              <h2>Inventory health</h2>
              <p>Current listing distribution</p>
            </div>
            <button className="icon-button subtle-icon" aria-label="More inventory health options (not available yet)" title="Inventory health options are not available yet" disabled><MoreHorizontal size={19} /></button>
          </div>
          <div className="health-total"><strong>38,642</strong><span>Total listings</span></div>
          <div className="health-bar">
            <span className="health-matched" />
            <span className="health-review" />
            <span className="health-unmatched" />
          </div>
          <div className="health-legend">
            <div><i className="legend-dot legend-teal" /><span>Matched</span><strong>80.8%</strong></div>
            <div><i className="legend-dot legend-champagne" /><span>Needs review</span><strong>12.4%</strong></div>
            <div><i className="legend-dot legend-slate" /><span>Unmatched</span><strong>6.8%</strong></div>
          </div>
          <div className="health-insight">
            <CheckCircle2 size={17} />
            <span>Most supplier listings are linked to canonical hotels.</span>
          </div>
        </article>
      </section>

      <section className="panel suppliers-panel">
        <div className="panel-heading">
          <div>
            <h2>Supplier connections</h2>
            <p>Overview of your connected inventory sources</p>
          </div>
          <Link className="text-link" to="/suppliers">View all suppliers <ArrowUpRight size={15} /></Link>
        </div>
        <div className="table-wrap">
          <table className="supplier-table">
            <thead><tr><th>SUPPLIER</th><th>LISTINGS</th><th>STATUS</th><th>LAST UPDATED</th><th /></tr></thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.name}>
                  <td><div className="supplier-name"><span className={`supplier-avatar ${supplier.color}`}>{supplier.initials}</span><strong>{supplier.name}</strong></div></td>
                  <td className="table-number">{supplier.listings}</td>
                  <td><span className={`status-pill ${supplier.status === 'Connected' ? 'status-connected' : 'status-processing'}`}><i />{supplier.status}</span></td>
                  <td className="updated-cell">{supplier.updated}</td>
                  <td><button className="icon-button subtle-icon" aria-label={`More options for ${supplier.name} (not available yet)`} title="Supplier row options are not available yet" disabled><MoreHorizontal size={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="demo-disclaimer">Illustrative demonstration figures only. These metrics are not connected to live supplier feeds or production matching runs.</p>
    </div>
  )
}
