from pydantic import BaseModel
from typing import Optional, Dict, Any


class PriceData(BaseModel):
    ticker: str
    price: float
    previous_close: Optional[float] = None
    change_pct: Optional[float] = None
    source: str
    stale: bool = False
    discrepancy_alert: Optional[str] = None


class TechnicalSignals(BaseModel):
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    ema_20: Optional[float] = None
    rsi_14: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None
    atr_14: Optional[float] = None
    vwap: Optional[float] = None
    obv: Optional[float] = None
    score_tendencia: float = 0.0
    score_momentum: float = 0.0
    score_volatilidad: float = 0.0
    score_volumen: float = 0.0
    score_tecnico: float = 0.0


class FundamentalData(BaseModel):
    pe_ratio: Optional[float] = None
    pe_sector_avg: Optional[float] = None
    revenue_growth: Optional[float] = None
    debt_equity: Optional[float] = None
    sector: str = "default"
    market_cap: Optional[float] = None
    source: str
    score_fundamental: float = 0.0


class SentimentData(BaseModel):
    score: float = 0.0          # -1 to +1
    news_count: int = 0
    positive: int = 0
    negative: int = 0
    neutral: int = 0
    latest_headlines: list[str] = []


class GeopoliticalData(BaseModel):
    gpr_index: float
    risk_level: str             # NORMAL | MEDIO | ALTO
    adjustment: float           # subtracted from base signal
    sector_sensitivity: float
    message: str


class OrderConfig(BaseModel):
    order_type: str             # MARKET | LIMIT | STOP | STOP_LIMIT | TRAILING_STOP | OCO
    description: str
    config: Dict[str, Any]
    rationale: str


class PositionSizing(BaseModel):
    capital: float
    risk_pct: float = 0.01
    entry_price: float
    stop_loss: float
    take_profit_1r5: float
    take_profit_3r: float
    position_size: int
    risk_amount: float
    reward_1r5: float
    reward_3r: float
    risk_reward_ratio: float


class AnalysisResponse(BaseModel):
    ticker: str
    timestamp: str
    price: PriceData
    technical: TechnicalSignals
    fundamental: FundamentalData
    sentiment: SentimentData
    geopolitical: GeopoliticalData
    score_tecnico: float
    score_fundamental: float
    score_sentimiento: float
    score_geopolitico: float
    score_final: float
    recommendation: str         # BUY | SELL | HOLD
    confidence: str             # HIGH | MEDIUM | LOW
    order: OrderConfig
    position: Optional[PositionSizing] = None
    disclaimer: str
