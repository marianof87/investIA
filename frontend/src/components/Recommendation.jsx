import { TrendingUp, TrendingDown, Minus, Database } from 'lucide-react'
import Disclaimer from './Disclaimer'

const icons = {
  BUY:  <TrendingUp size={28} />,
  SELL: <TrendingDown size={28} />,
  HOLD: <Minus size={28} />,
}

const labels = {
  BUY: 'COMPRAR',
  SELL: 'VENDER',
  HOLD: 'MANTENER',
}

export default function Recommendation({ data }) {
  const { price, recommendation, confidence, score_final, timestamp, disclaimer } = data
  const cls = recommendation.toLowerCase()

  const changeSign = price.change_pct > 0 ? '+' : ''
  const changeCls = price.change_pct > 0 ? 'pos' : price.change_pct < 0 ? 'neg' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Disclaimer text={disclaimer} />
      <div className={`card rec-card ${cls} animate-in`}>
        <div className={`rec-signal ${cls}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'column' }}>
            {icons[recommendation]}
            <span style={{ fontSize: '1.6rem' }}>{labels[recommendation]}</span>
          </div>
        </div>
        <div className="rec-details">
          <div className="rec-ticker">{price.ticker}</div>
          <div className="rec-price">${price.price?.toFixed(2)}</div>
          {price.change_pct != null && (
            <div className={`rec-change ${changeCls}`}>
              {changeSign}{price.change_pct?.toFixed(2)}% hoy
            </div>
          )}
          <div className="rec-meta">
            <span className="meta-chip">Score: {score_final > 0 ? '+' : ''}{score_final?.toFixed(3)}</span>
            <span className="meta-chip">Confianza: {confidence}</span>
            <span className="source-badge">
              <Database size={9} /> {price.source}
            </span>
          </div>
          {price.discrepancy_alert && (
            <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: 6, fontSize: '0.75rem', color: '#f59e0b', borderLeft: '2px solid #f59e0b' }}>
              {price.discrepancy_alert}
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', position: 'absolute', bottom: 12, right: 16 }}>
          {new Date(timestamp).toLocaleTimeString('es-AR')}
        </div>
      </div>
    </div>
  )
}
