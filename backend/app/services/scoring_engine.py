"""
Scoring Engine — Consolidates all signals into BUY/SELL/HOLD recommendation
with optimal order type selection and position sizing
"""
from app.models.analysis import (
    TechnicalSignals, FundamentalData, SentimentData,
    GeopoliticalData, OrderConfig, PositionSizing
)

DISCLAIMER_TEXT = (
    "⚠️ AVISO LEGAL — INFORMACIÓN ÚNICAMENTE. "
    "Esta aplicación proporciona herramientas de análisis e información educativa "
    "generada automáticamente a partir de datos públicos. NO constituye asesoramiento "
    "financiero personalizado. Las señales son generadas por algoritmos y no consideran "
    "su situación financiera individual. El rendimiento pasado no garantiza resultados "
    "futuros. Invertir implica riesgo, incluyendo la pérdida total del capital. "
    "Consulte con un asesor financiero certificado antes de invertir."
)


def compute_final_score(
    score_tecnico: float,
    score_fundamental: float,
    score_sentimiento: float,
    score_geopolitico: float,
) -> float:
    score = (
        0.35 * score_tecnico
        + 0.25 * score_fundamental
        + 0.20 * score_sentimiento
        + 0.20 * score_geopolitico
    )
    return round(max(-1.0, min(1.0, score)), 4)


def get_recommendation(score_final: float) -> tuple[str, str]:
    """Returns (recommendation, confidence)"""
    abs_score = abs(score_final)

    if score_final > 0.6:
        rec = "BUY"
    elif score_final < -0.6:
        rec = "SELL"
    else:
        rec = "HOLD"

    if abs_score > 0.8:
        confidence = "ALTA"
    elif abs_score > 0.5:
        confidence = "MEDIA"
    else:
        confidence = "BAJA"

    return rec, confidence


def select_order_type(
    technical: TechnicalSignals,
    recommendation: str,
    current_price: float,
    geo_data: GeopoliticalData,
    vix_proxy: float = 20.0,  # Use ATR as proxy if VIX unavailable
) -> OrderConfig:
    atr = technical.atr_14 or (current_price * 0.02)
    score_tendencia = technical.score_tendencia
    score_volatilidad = technical.score_volatilidad

    # High volatility proxy: ATR > 3% of price
    atr_pct = (atr / current_price) if current_price > 0 else 0.02
    high_volatility = atr_pct > 0.03 or geo_data.risk_level == "ALTO"

    # Breakout: strong momentum + trend
    breakout = technical.score_momentum > 0.7 and score_tendencia > 0.7

    # Strong uptrend + low volatility
    strong_uptrend_low_vol = score_tendencia > 0.5 and not high_volatility

    if recommendation == "SELL":
        # For sell signals, use stop orders for protection
        trigger = round(current_price * 0.98, 2)
        return OrderConfig(
            order_type="STOP_ORDER",
            description="Stop Order — Venta de protección",
            config={
                "trigger": trigger,
                "distancia_atr": round(2 * atr, 2),
                "stop_recomendado": round(current_price - 2 * atr, 2),
            },
            rationale="Señal bajista: proteger capital con stop-loss inmediato",
        )

    if high_volatility:
        trigger = round(current_price - 2 * atr, 2)
        limit = round(trigger * 0.995, 2)
        return OrderConfig(
            order_type="STOP_LIMIT",
            description="Stop-Limit — Alta volatilidad, control de slippage",
            config={
                "trigger": trigger,
                "limit": limit,
                "atr_14": round(atr, 2),
                "atr_pct": f"{atr_pct*100:.1f}%",
            },
            rationale=(
                f"Alta volatilidad detectada (ATR={atr_pct*100:.1f}% del precio). "
                "Stop-Limit protege contra slippage excesivo."
            ),
        )

    if breakout:
        return OrderConfig(
            order_type="MARKET_ORDER",
            description="Market Order — Ejecución inmediata en breakout",
            config={
                "ejecucion": "inmediata",
                "momentum_score": round(technical.score_momentum, 2),
                "nota": "Ejecutar antes de que el precio se escape",
            },
            rationale=(
                "Breakout detectado: fuerte momentum + tendencia alcista. "
                "Ejecución inmediata para no perder el movimiento."
            ),
        )

    if strong_uptrend_low_vol:
        soporte = technical.vwap or technical.sma_50 or round(current_price * 0.985, 2)
        return OrderConfig(
            order_type="LIMIT_ORDER",
            description="Limit Order — Esperar retroceso a soporte",
            config={
                "precio_limite": round(soporte, 2),
                "soporte_referencia": "VWAP/SMA50",
                "tendencia_score": round(score_tendencia, 2),
            },
            rationale=(
                "Tendencia alcista clara con baja volatilidad. "
                "Esperar retroceso a soporte (VWAP/SMA50) para mejor entrada."
            ),
        )

    # Default: stop order for downside protection
    trigger = round(current_price - 2 * atr, 2)
    return OrderConfig(
        order_type="STOP_ORDER",
        description="Stop Order — Protección estándar con stop-loss",
        config={
            "trigger": trigger,
            "distancia": round(2 * atr, 2),
            "porcentaje": f"{(2*atr/current_price)*100:.1f}%",
        },
        rationale="Señal neutra (HOLD): colocar stop-loss para gestión de riesgo.",
    )


def compute_position_sizing(
    current_price: float,
    atr: float,
    capital: float,
    recommendation: str,
) -> PositionSizing:
    risk_pct = 0.01  # 1% of capital
    risk_amount = capital * risk_pct

    # Stop-loss = entry - (2 × ATR)
    stop_loss = round(current_price - (2 * atr), 2)
    stop_distance = current_price - stop_loss

    if stop_distance <= 0:
        stop_distance = current_price * 0.02  # 2% fallback

    # Position size (shares)
    position_size = max(1, int(risk_amount / stop_distance))

    # Take profit targets
    r = stop_distance  # 1R
    take_profit_1r5 = round(current_price + (1.5 * r), 2)
    take_profit_3r = round(current_price + (3 * r), 2)

    reward_1r5 = round(position_size * (take_profit_1r5 - current_price), 2)
    reward_3r = round(position_size * (take_profit_3r - current_price), 2)

    return PositionSizing(
        capital=capital,
        risk_pct=risk_pct,
        entry_price=round(current_price, 2),
        stop_loss=stop_loss,
        take_profit_1r5=take_profit_1r5,
        take_profit_3r=take_profit_3r,
        position_size=position_size,
        risk_amount=round(risk_amount, 2),
        reward_1r5=reward_1r5,
        reward_3r=reward_3r,
        risk_reward_ratio=1.5,
    )


def get_disclaimer() -> str:
    return DISCLAIMER_TEXT
