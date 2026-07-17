import { useState } from 'react'
import { Search, Zap, DollarSign } from 'lucide-react'

const QUICK_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'JPM', 'SPY', 'QQQ']

export default function TickerSearch({ onAnalyze, loading }) {
  const [ticker, setTicker] = useState('')
  const [capital, setCapital] = useState('10000')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (ticker.trim()) {
      onAnalyze(ticker.trim().toUpperCase(), parseFloat(capital) || 10000)
    }
  }

  const handleQuickTicker = (t) => {
    setTicker(t)
    onAnalyze(t, parseFloat(capital) || 10000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Ticker input */}
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Ticker / Símbolo
          </label>
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input
              id="ticker-input"
              className="search-input"
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="Ej: AAPL, TSLA..."
              maxLength={10}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Capital input */}
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Capital Disponible (USD)
          </label>
          <div style={{ position: 'relative' }}>
            <DollarSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="capital-input"
              className="capital-input"
              type="number"
              value={capital}
              onChange={e => setCapital(e.target.value)}
              placeholder="10000"
              min="100"
              step="100"
              style={{ paddingLeft: 32 }}
            />
          </div>
        </div>

        <button
          id="analyze-btn"
          type="submit"
          className="analyze-btn"
          disabled={loading || !ticker.trim()}
        >
          <Zap size={16} />
          {loading ? 'Analizando...' : 'Analizar'}
        </button>
      </form>

      {/* Quick tickers */}
      <div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Acceso rápido
        </div>
        <div className="quick-tickers">
          {QUICK_TICKERS.map(t => (
            <button
              key={t}
              id={`quick-${t}`}
              className="ticker-pill"
              onClick={() => handleQuickTicker(t)}
              disabled={loading}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
