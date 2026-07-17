import { useState, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)

  const analyze = useCallback(async (ticker, capital = 10000) => {
    setLoading(true)
    setError(null)
    setData(null)
    setLoadingStep(1)

    try {
      // Simulate progressive loading steps for UX
      const stepTimer = setInterval(() => {
        setLoadingStep(prev => Math.min(prev + 1, 5))
      }, 600)

      const res = await fetch(
        `${API_BASE}/api/analyze/${ticker.toUpperCase()}?capital=${capital}`
      )

      clearInterval(stepTimer)
      setLoadingStep(5)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }

      const result = await res.json()
      setData(result)
    } catch (e) {
      setError(e.message || 'No se pudo conectar al servidor de análisis')
    } finally {
      setLoading(false)
      setLoadingStep(0)
    }
  }, [])

  const fetchHistorical = useCallback(async (ticker, period = '6mo') => {
    try {
      const res = await fetch(`${API_BASE}/api/historical/${ticker}?period=${period}`)
      if (!res.ok) throw new Error('Error fetching historical data')
      return await res.json()
    } catch {
      return null
    }
  }, [])

  return { data, loading, error, loadingStep, analyze, fetchHistorical }
}
