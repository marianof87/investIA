import { BarChart2 } from 'lucide-react'

function ScoreBar({ label, value, weight }) {
  const pct = Math.abs(value) * 100
  const cls = value > 0.1 ? 'pos' : value < -0.1 ? 'neg' : 'neu'
  // Convert -1..+1 to 0..100% for display (50% = 0)
  const barWidth = `${Math.abs(value) * 100}%`

  return (
    <div className="signal-bar-row">
      <div className="signal-bar-label">
        {label}
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: 4 }}>({weight})</span>
      </div>
      <div className="signal-bar-track">
        <div
          className={`signal-bar-fill ${cls}`}
          style={{ width: barWidth }}
        />
      </div>
      <div className={`signal-bar-val ${cls}`}>
        {value > 0 ? '+' : ''}{value?.toFixed(3)}
      </div>
    </div>
  )
}

export default function ScoreGauge({ data }) {
  const { score_final, score_tecnico, score_fundamental, score_sentimiento, score_geopolitico } = data

  // Arc gauge: -1..+1 maps to -140deg..+140deg (280deg total arc)
  const RADIUS = 70
  const STROKE = 10
  const ARC_DEG = 240
  const ARC_RAD = (ARC_DEG * Math.PI) / 180
  const CX = 90
  const CY = 90

  const startAngle = Math.PI / 2 + (Math.PI - ARC_RAD / 2)
  const endAngle   = Math.PI / 2 - (Math.PI - ARC_RAD / 2)

  const polarToXY = (angle, r = RADIUS) => ({
    x: CX + r * Math.cos(angle),
    y: CY - r * Math.sin(angle),
  })

  const arcPath = (from, to, r = RADIUS) => {
    const s = polarToXY(from, r)
    const e = polarToXY(to, r)
    const large = Math.abs(to - from) > Math.PI ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`
  }

  // Normalize score_final from -1..+1 to 0..ARC_DEG
  const normalized = (score_final + 1) / 2  // 0..1
  const needleAngle = startAngle + normalized * (endAngle - startAngle) * -1 +
    (startAngle - endAngle) * normalized // Recalculate properly
  
  // Simple needle angle: startAngle to endAngle mapping
  const totalSweep = -(endAngle - startAngle)  // positive sweep
  const angleRad = startAngle - normalized * totalSweep
  const needle = polarToXY(angleRad, RADIUS - 12)

  const gaugeColor = score_final > 0.3 ? '#10b981' : score_final < -0.3 ? '#ef4444' : '#f59e0b'
  const fillEnd = polarToXY(angleRad, RADIUS)

  return (
    <div className="card animate-in" style={{ gridColumn: '1 / -1' }}>
      <div className="card-title"><BarChart2 size={14} /> Score Consolidado</div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Arc Gauge */}
        <div className="gauge-container" style={{ minWidth: 180 }}>
          <svg width={180} height={130} className="gauge-svg">
            {/* Background track */}
            <path
              d={arcPath(startAngle, endAngle)}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
            {/* Colored fill arc */}
            <path
              d={arcPath(startAngle, angleRad)}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={STROKE}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${gaugeColor}88)` }}
            />
            {/* Needle dot */}
            <circle cx={needle.x} cy={needle.y} r={6} fill={gaugeColor} style={{ filter: `drop-shadow(0 0 8px ${gaugeColor})` }} />
            {/* Center score */}
            <text x={CX} y={CY + 10} textAnchor="middle" fill={gaugeColor} fontSize={24} fontWeight={800} fontFamily="JetBrains Mono, monospace">
              {score_final > 0 ? '+' : ''}{score_final?.toFixed(2)}
            </text>
            {/* Labels */}
            <text x={18} y={CY + 30} fill="#ef4444" fontSize={9} fontWeight={600}>SELL</text>
            <text x={CX - 12} y={14} fill="#f59e0b" fontSize={9} fontWeight={600}>HOLD</text>
            <text x={152} y={CY + 30} fill="#10b981" fontSize={9} fontWeight={600}>BUY</text>
          </svg>
        </div>

        {/* Score breakdown bars */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <ScoreBar label="Técnico"     value={score_tecnico}      weight="35%" />
          <ScoreBar label="Fundamental" value={score_fundamental}   weight="25%" />
          <ScoreBar label="Sentimiento" value={score_sentimiento}   weight="20%" />
          <ScoreBar label="Geopolítico" value={score_geopolitico}   weight="20%" />
        </div>
      </div>
    </div>
  )
}
