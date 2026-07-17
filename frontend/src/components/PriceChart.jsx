import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries } from 'lightweight-charts'
import { LineChart } from 'lucide-react'

const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y']

export default function PriceChart({ ticker, fetchHistorical, technical }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const [period, setPeriod] = useState('6mo')
  const [loadingChart, setLoadingChart] = useState(false)

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(59,130,246,0.4)', labelBackgroundColor: '#1e3a5f' },
        horzLine: { color: 'rgba(59,130,246,0.4)', labelBackgroundColor: '#1e3a5f' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.resize(containerRef.current.clientWidth, 320)
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [])

  // Load data when ticker or period changes
  useEffect(() => {
    if (!ticker || !candleSeriesRef.current) return

    setLoadingChart(true)
    fetchHistorical(ticker, period).then(result => {
      if (result?.data && candleSeriesRef.current) {
        candleSeriesRef.current.setData(result.data)
        chartRef.current?.timeScale().fitContent()

        // Overlay SMA lines if available
        if (technical?.sma_50 || technical?.sma_200) {
          // Add reference lines (simplified as price lines)
          if (technical.sma_50) {
            candleSeriesRef.current.createPriceLine({
              price: technical.sma_50,
              color: '#f59e0b',
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              title: 'SMA50',
            })
          }
          if (technical.sma_200) {
            candleSeriesRef.current.createPriceLine({
              price: technical.sma_200,
              color: '#8b5cf6',
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              title: 'SMA200',
            })
          }
          if (technical.bb_upper) {
            candleSeriesRef.current.createPriceLine({
              price: technical.bb_upper,
              color: 'rgba(59,130,246,0.5)',
              lineWidth: 1,
              lineStyle: 3,
              title: 'BB↑',
            })
          }
          if (technical.bb_lower) {
            candleSeriesRef.current.createPriceLine({
              price: technical.bb_lower,
              color: 'rgba(59,130,246,0.5)',
              lineWidth: 1,
              lineStyle: 3,
              title: 'BB↓',
            })
          }
        }
      }
      setLoadingChart(false)
    })
  }, [ticker, period, fetchHistorical, technical])

  return (
    <div className="card full-width animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>
          <LineChart size={14} /> Gráfico de Precio — {ticker}
          <span className="source-badge" style={{ marginLeft: 6 }}>yfinance</span>
        </div>
        <div className="chart-period-btns">
          {PERIODS.map(p => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
              id={`period-${p}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <div ref={containerRef} className="chart-container" />
        {loadingChart && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(8,12,20,0.6)', borderRadius: 8
          }}>
            <div className="spinner" />
          </div>
        )}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.72rem', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}>
          <span style={{ width: 20, height: 2, background: '#f59e0b', display: 'inline-block' }} /> SMA 50
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b5cf6' }}>
          <span style={{ width: 20, height: 2, background: '#8b5cf6', display: 'inline-block' }} /> SMA 200
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3b82f6' }}>
          <span style={{ width: 20, height: 2, background: '#3b82f6', display: 'inline-block', opacity: 0.5 }} /> Bollinger Bands
        </span>
      </div>
    </div>
  )
}
