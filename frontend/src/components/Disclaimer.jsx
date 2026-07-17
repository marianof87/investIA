import { AlertTriangle } from 'lucide-react'

export default function Disclaimer({ text }) {
  const message = text || (
    '⚠️ AVISO LEGAL — Esta aplicación proporciona información educativa generada automáticamente. ' +
    'NO constituye asesoramiento financiero personalizado. Invertir implica riesgo, incluyendo la ' +
    'pérdida total del capital. Consulte con un asesor financiero certificado antes de invertir.'
  )

  return (
    <div className="disclaimer-bar" role="alert" aria-label="Aviso legal">
      <AlertTriangle size={14} className="disclaimer-icon" />
      <span>{message}</span>
    </div>
  )
}
