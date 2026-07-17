import './index.css'
import { TrendingUp, Activity, AlertCircle } from 'lucide-react'
import { useAnalysis } from './hooks/useAnalysis'
import TickerSearch from './components/TickerSearch'
import Recommendation from './components/Recommendation'
import ScoreGauge from './components/ScoreGauge'
import PriceChart from './components/PriceChart'
import TechnicalPanel from './components/TechnicalPanel'
import FundamentalPanel from './components/FundamentalPanel'
import SentimentPanel from './components/SentimentPanel'
import GeopoliticalPanel from './components/GeopoliticalPanel'
import OrderConfig from './components/OrderConfig'
import PositionSizing from './components/PositionSizing'
import Disclaimer from './components/Disclaimer'

const LOADING_STEPS = [
  'Consultando precio en tiempo real...',
  'Descargando datos históricos (yfinance)...',
  'Calculando indicadores técnicos (pandas_ta)...',
  'Analizando fundamentales...',
  'Procesando sentimiento de noticias...',
]

function LoadingState({ step }) {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
          Analizando...
        </div>
        <ul className="loading-steps">
          {LOADING_STEPS.map((s, i) => (
            <li key={i} className={`loading-step ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
              <span>{i < step ? '✓' : i === step ? '◉' : '○'}</span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <TrendingUp size={48} style={{ color: 'var(--accent-blue)', opacity: 0.4 }} />
      <h2>Selecciona un ticker para analizar</h2>
      <p>
        Ingresa el símbolo de una acción o ETF y el sistema consultará múltiples fuentes de datos
        para generar una señal BUY / SELL / HOLD con gestión de riesgo incluida.
      </p>
      <Disclaimer />
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="empty-state">
      <AlertCircle size={48} style={{ color: 'var(--sell-color)', opacity: 0.6 }} />
      <h2 style={{ color: 'var(--sell-color)' }}>Error de análisis</h2>
      <p>{message}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Asegúrate de que el backend esté corriendo en http://localhost:8000
      </p>
    </div>
  )
}

import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h2>React crashed</h2>
          <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            {this.state.error && this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { data, loading, error, loadingStep, analyze, fetchHistorical } = useAnalysis()

  return (
    <ErrorBoundary>
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <Activity size={20} style={{ color: 'var(--accent-blue)' }} />
          IA<span>investor</span>
        </div>
        <span className="header-badge">Beta</span>
        <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Análisis multi-fuente · BUY / SELL / HOLD
        </div>
      </header>

      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Nueva Consulta
          </div>
          <TickerSearch onAnalyze={analyze} loading={loading} />
        </div>

        {/* Data sources legend */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Fuentes de Datos
          </div>
          {[
            { src: 'Alpaca',         info: 'Precio RT',       priority: 1 },
            { src: 'Finnhub',        info: 'Noticias',        priority: 2 },
            { src: 'FMP',            info: 'Fundamentales',   priority: 3 },
            { src: 'pandas_ta',      info: 'Técnico (local)', priority: '—' },
            { src: 'yfinance',       info: 'Fallback',        priority: 5 },
            { src: 'GPR Index',      info: 'Geopolítico',     priority: '—' },
          ].map(({ src, info, priority }) => (
            <div key={src} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, marginBottom: 4, background: 'var(--bg-glass)', fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{src}</span>
              <span style={{ color: 'var(--text-muted)' }}>{info}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {loading && <LoadingState step={loadingStep} />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && !data && <EmptyState />}

        {!loading && !error && data && (
          <>
            {/* Top: Recommendation card + Score gauge */}
            <Recommendation data={data} />
            <ScoreGauge data={data} />

            {/* Chart (full width) */}
            <PriceChart
              ticker={data.ticker}
              fetchHistorical={fetchHistorical}
              technical={data.technical}
            />

            {/* 2-column grid */}
            <div className="analysis-grid">
              <TechnicalPanel technical={data.technical} currentPrice={data.price?.price} />
              <FundamentalPanel fundamental={data.fundamental} />
              <SentimentPanel sentiment={data.sentiment} />
              <GeopoliticalPanel geopolitical={data.geopolitical} />
              <OrderConfig order={data.order} disclaimer={data.disclaimer} />
              <PositionSizing position={data.position} />
            </div>

            {/* Bottom disclaimer */}
            <Disclaimer text={data.disclaimer} />
          </>
        )}
      </main>
    </div>
    </ErrorBoundary>
  )
}
