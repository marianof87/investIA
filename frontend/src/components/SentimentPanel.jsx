import { MessageSquare } from 'lucide-react'

export default function SentimentPanel({ sentiment }) {
  const s = sentiment
  if (!s) return null

  // Map score -1..+1 to 0..100% for cursor position
  const cursorPct = ((s.score + 1) / 2) * 100

  const scoreColor = s.score > 0.1 ? 'var(--buy-color)' : s.score < -0.1 ? 'var(--sell-color)' : 'var(--hold-color)'
  const scoreLabel = s.score > 0.2 ? 'Positivo' : s.score < -0.2 ? 'Negativo' : 'Neutral'

  return (
    <div className="card animate-in">
      <div className="card-title"><MessageSquare size={14} /> Sentimiento del Mercado</div>

      <div className="sentiment-score-display">
        <div className="sentiment-number" style={{ color: scoreColor }}>
          {s.score > 0 ? '+' : ''}{s.score?.toFixed(3)}
        </div>
        <div style={{ fontSize: '0.8rem', color: scoreColor, marginTop: 2 }}>{scoreLabel}</div>
      </div>

      {/* Sentiment gradient bar */}
      <div style={{ marginBottom: 12 }}>
        <div className="sentiment-bar">
          <div
            className="sentiment-cursor"
            style={{ left: `${cursorPct}%` }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
          <span>Muy Negativo (-1)</span>
          <span>Neutral (0)</span>
          <span>Muy Positivo (+1)</span>
        </div>
      </div>

      {/* News counts */}
      {s.news_count > 0 && (
        <div className="sentiment-counts" style={{ marginBottom: 12 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {s.news_count} noticias analizadas:
          </span>
          <span className="sent-count" style={{ color: 'var(--buy-color)' }}>
            ● {s.positive} positivas
          </span>
          <span className="sent-count" style={{ color: 'var(--sell-color)' }}>
            ● {s.negative} negativas
          </span>
          <span className="sent-count" style={{ color: 'var(--hold-color)' }}>
            ● {s.neutral} neutrales
          </span>
        </div>
      )}

      {/* Headlines */}
      {s.latest_headlines?.length > 0 && (
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Últimos titulares
          </div>
          <ul className="headlines-list">
            {s.latest_headlines.map((h, i) => (
              <li key={i} className="headline-item">{h}</li>
            ))}
          </ul>
        </div>
      )}

      {s.news_count === 0 && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
          Sin noticias recientes (requiere token Finnhub)
        </div>
      )}

      <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score Sentimiento (VADER)</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: scoreColor }}>
          {s.score > 0 ? '+' : ''}{s.score?.toFixed(4)}
        </span>
      </div>
    </div>
  )
}
