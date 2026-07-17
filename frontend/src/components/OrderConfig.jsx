import { ShoppingCart } from 'lucide-react'
import Disclaimer from './Disclaimer'

const ORDER_ICONS = {
  MARKET_ORDER:  '⚡',
  LIMIT_ORDER:   '🎯',
  STOP_ORDER:    '🛡️',
  STOP_LIMIT:    '🔒',
  TRAILING_STOP: '📈',
  OCO:           '⚖️',
}

export default function OrderConfig({ order, disclaimer }) {
  if (!order) return null

  const icon = ORDER_ICONS[order.order_type] || '📋'

  return (
    <div className="card animate-in">
      <div className="card-title"><ShoppingCart size={14} /> Tipo de Orden Recomendada</div>
      <Disclaimer text={disclaimer} />

      <div style={{ marginTop: 14 }}>
        <div className="order-type-badge">
          {icon} {order.order_type.replace(/_/g, ' ')}
        </div>
        <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
          {order.description}
        </div>

        <table className="order-config-table">
          <tbody>
            {Object.entries(order.config).map(([key, val]) => (
              <tr key={key}>
                <td>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                <td>{typeof val === 'number' ? `$${val.toFixed(2)}` : String(val)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="order-rationale">{order.rationale}</div>
      </div>
    </div>
  )
}
