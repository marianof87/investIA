import { PieChart } from 'lucide-react'

const fmt = (v, suffix = '') => v == null ? '—' : `${v.toFixed(2)}${suffix}`
const fmtPct = (v) => v == null ? '—' : `${(v * 100).toFixed(1)}%`
const fmtM = (v) => {
  if (v == null) return '—'
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`
  return `$${v.toFixed(0)}`
}

export default function FundamentalPanel({ fundamental }) {
  const f = fundamental
  if (!f) return null

  const peColor = f.pe_ratio && f.pe_sector_avg
    ? (f.pe_ratio < f.pe_sector_avg ? 'var(--buy-color)' : 'var(--sell-color)')
    : 'var(--text-primary)'

  const growthColor = f.revenue_growth == null ? 'var(--text-primary)'
    : f.revenue_growth > 0 ? 'var(--buy-color)' : 'var(--sell-color)'

  return (
    <div className="card animate-in">
      <div className="card-title">
        <PieChart size={14} /> Fundamentales
        <span className="source-badge">{f.source}</span>
      </div>

      <div className="fundamental-grid">
        <div className="fund-stat">
          <div className="fund-stat-label">P/E Ratio</div>
          <div className="fund-stat-value" style={{ color: peColor }}>{fmt(f.pe_ratio, 'x')}</div>
          <div className="fund-stat-sub">Sector avg: {fmt(f.pe_sector_avg, 'x')}</div>
        </div>

        <div className="fund-stat">
          <div className="fund-stat-label">Crecimiento Ingresos</div>
          <div className="fund-stat-value" style={{ color: growthColor }}>{fmtPct(f.revenue_growth)}</div>
          <div className="fund-stat-sub">YoY</div>
        </div>

        <div className="fund-stat">
          <div className="fund-stat-label">Deuda / Equity</div>
          <div className="fund-stat-value" style={{ color: f.debt_equity != null && f.debt_equity < 1 ? 'var(--buy-color)' : 'var(--sell-color)' }}>
            {fmt(f.debt_equity, 'x')}
          </div>
          <div className="fund-stat-sub">{f.debt_equity < 0.5 ? 'Bajo riesgo' : f.debt_equity < 1 ? 'Moderado' : 'Alto'}</div>
        </div>

        <div className="fund-stat">
          <div className="fund-stat-label">Market Cap</div>
          <div className="fund-stat-value">{fmtM(f.market_cap)}</div>
          <div className="fund-stat-sub">{f.sector}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score Fundamental Total</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem',
          color: f.score_fundamental > 0.1 ? 'var(--buy-color)' : f.score_fundamental < -0.1 ? 'var(--sell-color)' : 'var(--hold-color)'
        }}>
          {f.score_fundamental > 0 ? '+' : ''}{f.score_fundamental?.toFixed(4)}
        </span>
      </div>
    </div>
  )
}
