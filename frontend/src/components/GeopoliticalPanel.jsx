import { Globe } from 'lucide-react'

export default function GeopoliticalPanel({ geopolitical }) {
  const g = geopolitical
  if (!g) return null

  const riskCls = g.risk_level === 'ALTO' ? 'alto' : g.risk_level === 'MEDIO' ? 'medio' : 'normal'
  const riskLabel = { NORMAL: '✅ RIESGO NORMAL', MEDIO: '⚠️ RIESGO MEDIO', ALTO: '🚨 RIESGO ALTO' }[g.risk_level]

  // GPR scale: 0-250, needle at gpr_index
  // Zones: 0-100 green, 100-150 yellow, 150-250 red
  const gprPct = Math.min(100, (g.gpr_index / 250) * 100)

  return (
    <div className="card animate-in">
      <div className="card-title"><Globe size={14} /> Riesgo Geopolítico (GPR Index)</div>

      <div className={`geo-risk-badge ${riskCls}`}>{riskLabel}</div>

      {/* GPR Meter */}
      <div className="gpr-meter">
        <div className="gpr-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          GPR: {g.gpr_index}
        </div>
        <div className="gpr-track" style={{ flex: 1, height: 8, background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 40%, #ef4444 60%)', borderRadius: 4, position: 'relative' }}>
          <div
            className="gpr-needle"
            style={{ left: `${gprPct}%` }}
          />
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>250</div>
      </div>

      {/* Scale reference */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4, marginBottom: 12 }}>
        <span style={{ color: 'var(--buy-color)' }}>0 — Normal</span>
        <span style={{ color: 'var(--hold-color)' }}>100 — Moderado</span>
        <span style={{ color: 'var(--sell-color)' }}>150+ — Crítico</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Sensibilidad Sector
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {g.sector_sensitivity}×
          </div>
        </div>
        <div style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Ajuste al Score
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700,
            color: g.adjustment > 0 ? 'var(--sell-color)' : 'var(--buy-color)'
          }}>
            -{g.adjustment?.toFixed(3)}
          </div>
        </div>
      </div>

      <div className="geo-message">{g.message}</div>
    </div>
  )
}
