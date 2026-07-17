"""
Geopolitical Risk Service
Uses local GPR (Geopolitical Risk Index) data seeded in SQLite
Source: Caldara & Iacoviello GPR Index (caldara.net/gpr)
"""
from app.db.database import get_connection
from app.models.analysis import GeopoliticalData

SECTOR_SENSITIVITY = {
    "Energy": 1.5,
    "Technology": 1.3,
    "Semiconductors": 1.4,
    "Airlines": 1.4,
    "Defense": 0.8,
    "Utilities": 1.2,
    "Healthcare": 1.0,
    "Consumer Defensive": 0.9,
    "Financial Services": 1.1,
    "Consumer Cyclical": 1.1,
    "Basic Materials": 1.3,
    "Communication Services": 1.1,
    "Real Estate": 1.0,
    "Industrials": 1.2,
    "default": 1.0,
}

# Sector name normalization (yfinance → sensitivity map)
SECTOR_ALIASES = {
    "technology": "Technology",
    "healthcare": "Healthcare",
    "financial services": "Financial Services",
    "consumer cyclical": "Consumer Cyclical",
    "consumer defensive": "Consumer Defensive",
    "energy": "Energy",
    "industrials": "Industrials",
    "basic materials": "Basic Materials",
    "real estate": "Real Estate",
    "utilities": "Utilities",
    "communication services": "Communication Services",
}


def get_latest_gpr() -> float:
    conn = get_connection()
    row = conn.execute(
        "SELECT gpr_index FROM gpr_data ORDER BY date DESC LIMIT 1"
    ).fetchone()
    conn.close()
    return float(row["gpr_index"]) if row else 120.0  # Default moderate risk


def get_geopolitical_data(sector: str) -> GeopoliticalData:
    gpr = get_latest_gpr()

    # Normalize sector name
    sector_key = SECTOR_ALIASES.get(sector.lower(), sector)
    sensitivity = SECTOR_SENSITIVITY.get(sector_key, SECTOR_SENSITIVITY["default"])

    # Risk level classification
    if gpr > 150:
        risk_level = "ALTO"
        adjustment = 0.30 * sensitivity
        message = (
            f"🚨 RIESGO GEOPOLÍTICO ALTO (GPR={gpr:.1f}) — "
            "Reducir exposición significativamente. "
            f"Sector '{sector}' tiene sensibilidad {sensitivity}×."
        )
    elif gpr > 100:
        risk_level = "MEDIO"
        adjustment = 0.15 * sensitivity
        message = (
            f"⚠️ RIESGO GEOPOLÍTICO MEDIO (GPR={gpr:.1f}) — "
            "Operar con cautela. Ajustar stops. "
            f"Sector '{sector}' tiene sensibilidad {sensitivity}×."
        )
    else:
        risk_level = "NORMAL"
        adjustment = 0.0
        message = (
            f"✅ RIESGO GEOPOLÍTICO NORMAL (GPR={gpr:.1f}) — "
            "Condiciones geopolíticas estables para operar."
        )

    # Geopolitical score: -adjustment..0 (always reduces score or neutral)
    geo_score = -adjustment

    return GeopoliticalData(
        gpr_index=round(gpr, 1),
        risk_level=risk_level,
        adjustment=round(adjustment, 4),
        sector_sensitivity=sensitivity,
        message=message,
    ), round(geo_score, 4)
