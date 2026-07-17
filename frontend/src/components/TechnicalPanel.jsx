import { Activity } from 'lucide-react'

function IndicatorChip({ name, value, format = 'number', signal }) {
  const formatted = value == null
    ? '—'
    : format === 'pct'
      ? `${value.toFixed(1)}%`
      : value.toFixed(2)

  const cls = signal === 'bull' ? 'bull' : signal === 'bear' ? 'bear' : 'neu'
  const signalLabel = signal === 'bull' ? '↑ Alcista' : signal === 'bear' ? '↓ Bajista' : '→ Neutral'

  return (
    <div className="indicator-chip">
      <div className="indicator-name">{name}</div>
      <div className="indicator-value">{formatted}</div>
      <div className={`indicator-signal ${cls}`}>{signalLabel}</div>
    </div>
  )
}

function getSignal(value, low, high) {
  if (value == null) return 'neu'
  if (value > high) return 'bull'
  if (value < low)  return 'bear'
  return 'neu'
}

export default function TechnicalPanel({ technical, currentPrice }) {
  const t = technical
  if (!t) return null

  const rsiSignal = t.rsi_14 == null ? 'neu'
    : t.rsi_14 < 30 ? 'bull'
    : t.rsi_14 > 70 ? 'bear' : 'neu'

  const macdSignal = t.macd != null && t.macd_signal != null
    ? (t.macd > t.macd_signal ? 'bull' : 'bear')
    : 'neu'

  const smaSignal = t.sma_50 && currentPrice
    ? (currentPrice > t.sma_50 ? 'bull' : 'bear')
    : 'neu'

  const bbSignal = t.bb_lower && t.bb_upper && currentPrice
    ? currentPrice <= t.bb_lower * 1.01 ? 'bull'
    : currentPrice >= t.bb_upper * 0.99 ? 'bear' : 'neu'
    : 'neu'

  const vwapSignal = t.vwap && currentPrice
    ? (currentPrice > t.vwap ? 'bull' : 'bear') : 'neu'

  return (
    <div className="card animate-in">
      <div className="card-title"><Activity size={14} /> Análisis Técnico</div>

      {/* Score bars */}
      <div style={{ marginBottom: 16 }}>
        {[
          { label: 'Tendencia',    value: t.score_tendencia,   weight: '30%' },
          { label: 'Momentum',     value: t.score_momentum,    weight: '25%' },
          { label: 'Volatilidad',  value: t.score_volatilidad, weight: '25%' },
          { label: 'Volumen',      value: t.score_volumen,     weight: '20%' },
        ].map(row => {
          const pct = Math.abs(row.value) * 100
          const cls = row.value > 0.1 ? 'pos' : row.value < -0.1 ? 'neg' : 'neu'
          return (
            <div key={row.label} className="signal-bar-row">
              <div className="signal-bar-label">
                {row.label}
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: 4 }}>({row.weight})</span>
              </div>
              <div className="signal-bar-track">
                <div className={`signal-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
              </div>
              <div className={`signal-bar-val ${cls}`}>
                {row.value > 0 ? '+' : ''}{row.value?.toFixed(3)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Indicators grid */}
      <div className="indicators-grid">
        <IndicatorChip name="RSI (14)"    value={t.rsi_14}    signal={rsiSignal} />
        <IndicatorChip name="MACD"        value={t.macd}       signal={macdSignal} />
        <IndicatorChip name="SMA 50"      value={t.sma_50}     signal={smaSignal} />
        <IndicatorChip name="SMA 200"     value={t.sma_200}    signal={smaSignal} />
        <IndicatorChip name="EMA 20"      value={t.ema_20}     signal={smaSignal} />
        <IndicatorChip name="ATR (14)"    value={t.atr_14}     signal="neu" />
        <IndicatorChip name="VWAP"        value={t.vwap}       signal={vwapSignal} />
        <IndicatorChip name="BB Superior" value={t.bb_upper}   signal={bbSignal} />
        <IndicatorChip name="BB Inferior" value={t.bb_lower}   signal={bbSignal} />
        <IndicatorChip name="BB Media"    value={t.bb_middle}  signal="neu" />
      </div>

      <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score Técnico Total</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem',
          color: t.score_tecnico > 0.1 ? 'var(--buy-color)' : t.score_tecnico < -0.1 ? 'var(--sell-color)' : 'var(--hold-color)'
        }}>
          {t.score_tecnico > 0 ? '+' : ''}{t.score_tecnico?.toFixed(4)}
        </span>
      </div>
    </div>
  )
}
