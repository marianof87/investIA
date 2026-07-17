import { Shield } from 'lucide-react'

const fmt$ = (v) => v == null ? '—' : `$${v.toFixed(2)}`

export default function PositionSizing({ position }) {
  const p = position
  if (!p) return null

  return (
    <div className="card animate-in full-width">
      <div className="card-title"><Shield size={14} /> Gestión de Riesgo & Position Sizing</div>

      <div className="position-grid">
        <div className="position-stat highlight">
          <div className="position-stat-label">Acciones a Comprar</div>
          <div className="position-stat-value">{p.position_size} acciones</div>
        </div>

        <div className="position-stat">
          <div className="position-stat-label">Precio de Entrada</div>
          <div className="position-stat-value">{fmt$(p.entry_price)}</div>
        </div>

        <div className="position-stat danger">
          <div className="position-stat-label">Stop-Loss (2×ATR)</div>
          <div className="position-stat-value">{fmt$(p.stop_loss)}</div>
        </div>

        <div className="position-stat">
          <div className="position-stat-label">Riesgo por Trade</div>
          <div className="position-stat-value" style={{ color: 'var(--sell-color)' }}>
            ${p.risk_amount?.toFixed(2)} ({(p.risk_pct * 100).toFixed(0)}%)
          </div>
        </div>

        <div className="position-stat success">
          <div className="position-stat-label">Take Profit 1 (1.5R)</div>
          <div className="position-stat-value">{fmt$(p.take_profit_1r5)}</div>
        </div>

        <div className="position-stat success">
          <div className="position-stat-label">Take Profit 2 (3R)</div>
          <div className="position-stat-value">{fmt$(p.take_profit_3r)}</div>
        </div>

        <div className="position-stat">
          <div className="position-stat-label">Ganancia Potencial (1.5R)</div>
          <div className="position-stat-value" style={{ color: 'var(--buy-color)' }}>
            ${p.reward_1r5?.toFixed(2)}
          </div>
        </div>

        <div className="position-stat">
          <div className="position-stat-label">Ganancia Potencial (3R)</div>
          <div className="position-stat-value" style={{ color: 'var(--buy-color)' }}>
            ${p.reward_3r?.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Risk/Reward visual */}
      <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Relación Riesgo/Beneficio
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, background: 'var(--sell-color)', borderRadius: 2 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Riesgo 1R = ${p.risk_amount?.toFixed(0)}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>→</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 18, height: 12, background: 'var(--buy-color)', borderRadius: 2 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>TP1 1.5R = ${p.reward_1r5?.toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 36, height: 12, background: 'var(--buy-color)', borderRadius: 2 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>TP2 3R = ${p.reward_3r?.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Capital: ${p.capital?.toLocaleString('es-AR')} · Riesgo máximo 1% por trade · Stop-loss = Entrada − (2 × ATR 14)
      </div>
    </div>
  )
}
