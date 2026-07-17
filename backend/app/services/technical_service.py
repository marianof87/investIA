"""
Technical Analysis Service — 100% local with pure pandas (0 API calls)
Calculates: SMA(50/200), EMA(20), RSI(14), MACD, Bollinger Bands, ATR(14), VWAP, OBV
"""
import pandas as pd
import yfinance as yf
import numpy as np
from app.models.analysis import TechnicalSignals


def _normalize(value: float, low: float, high: float) -> float:
    """Normalize value to -1..+1 range"""
    if high == low:
        return 0.0
    return max(-1.0, min(1.0, 2 * (value - low) / (high - low) - 1))


def _get_historical_data(ticker: str, period: str = "1y") -> pd.DataFrame:
    tk = yf.Ticker(ticker)
    df = tk.history(period=period, interval="1d")
    if df.empty:
        raise ValueError(f"No hay datos históricos para {ticker}")
    df.columns = [c.lower() for c in df.columns]
    return df


def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).fillna(0)
    loss = (-delta.where(delta < 0, 0)).fillna(0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd = ema_fast - ema_slow
    macd_signal = macd.ewm(span=signal, adjust=False).mean()
    macd_hist = macd - macd_signal
    return macd, macd_signal, macd_hist


def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period, min_periods=period).mean()


def compute_technical_signals(ticker: str) -> TechnicalSignals:
    df = _get_historical_data(ticker)

    # ── Trend indicators ──────────────────────────────────────────────────────
    df["sma_50"] = df["close"].rolling(window=50).mean()
    df["sma_200"] = df["close"].rolling(window=200).mean()
    df["ema_20"] = df["close"].ewm(span=20, adjust=False).mean()

    # ── Momentum ──────────────────────────────────────────────────────────────
    df["rsi"] = calculate_rsi(df["close"], 14)
    macd, macd_signal, macd_hist = calculate_macd(df["close"])
    df["macd"] = macd
    df["macd_signal"] = macd_signal
    df["macd_hist"] = macd_hist

    # ── Volatility ────────────────────────────────────────────────────────────
    df["bb_middle"] = df["close"].rolling(window=20).mean()
    std = df["close"].rolling(window=20).std()
    df["bb_upper"] = df["bb_middle"] + 2 * std
    df["bb_lower"] = df["bb_middle"] - 2 * std
    df["atr"] = calculate_atr(df["high"], df["low"], df["close"], 14)

    # ── Volume ────────────────────────────────────────────────────────────────
    typ_price = (df["high"] + df["low"] + df["close"]) / 3
    df["vwap"] = (typ_price * df["volume"]).cumsum() / df["volume"].cumsum()
    df["obv"] = (np.sign(df["close"].diff()) * df["volume"]).fillna(0).cumsum()

    # Use last valid row
    latest = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else latest

    close = float(latest["close"])
    sma_50 = float(latest["sma_50"]) if pd.notna(latest["sma_50"]) else None
    sma_200 = float(latest.get("sma_200", np.nan)) if pd.notna(latest.get("sma_200", np.nan)) else None
    ema_20 = float(latest["ema_20"]) if pd.notna(latest["ema_20"]) else None
    rsi = float(latest["rsi"]) if pd.notna(latest["rsi"]) else None
    macd_val = float(latest["macd"]) if pd.notna(latest["macd"]) else None
    macd_sig = float(latest["macd_signal"]) if pd.notna(latest["macd_signal"]) else None
    macd_hist_val = float(latest["macd_hist"]) if pd.notna(latest["macd_hist"]) else None
    bb_upper = float(latest["bb_upper"]) if pd.notna(latest["bb_upper"]) else None
    bb_middle = float(latest["bb_middle"]) if pd.notna(latest["bb_middle"]) else None
    bb_lower = float(latest["bb_lower"]) if pd.notna(latest["bb_lower"]) else None
    atr = float(latest["atr"]) if pd.notna(latest["atr"]) else None
    vwap = float(latest["vwap"]) if pd.notna(latest["vwap"]) else None
    obv = float(latest["obv"]) if pd.notna(latest["obv"]) else None

    # ── Score: Tendencia (0.30) ───────────────────────────────────────────────
    score_tendencia = 0.0
    if sma_50 and sma_200:
        if close > sma_50 > sma_200:
            score_tendencia = 1.0   # Bullish
        elif close < sma_50 < sma_200:
            score_tendencia = -1.0  # Bearish
        elif close > sma_50:
            score_tendencia = 0.5
        elif close < sma_50:
            score_tendencia = -0.5
    elif sma_50:
        score_tendencia = 0.6 if close > sma_50 else -0.6

    # ── Score: Momentum (0.25) ────────────────────────────────────────────────
    score_momentum = 0.0
    if rsi:
        if rsi < 30:
            rsi_score = 0.8
        elif rsi < 50:
            rsi_score = 0.4
        elif rsi < 70:
            rsi_score = -0.2
        else:
            rsi_score = -0.8
        score_momentum = rsi_score

    if macd_val is not None and macd_sig is not None:
        macd_score = 0.5 if macd_val > macd_sig else -0.5
        try:
            prev_macd = float(prev["macd"])
            prev_sig = float(prev["macd_signal"])
            if prev_macd < prev_sig and macd_val > macd_sig:
                macd_score = 1.0
            elif prev_macd > prev_sig and macd_val < macd_sig:
                macd_score = -1.0
        except Exception:
            pass
        score_momentum = (score_momentum + macd_score) / 2

    # ── Score: Volatilidad (0.25) ─────────────────────────────────────────────
    score_volatilidad = 0.0
    if bb_lower and bb_upper and bb_middle:
        bb_range = bb_upper - bb_lower
        if bb_range > 0:
            position_in_band = (close - bb_lower) / bb_range
            score_volatilidad = _normalize(position_in_band, 0, 1) * -1
            if close <= bb_lower * 1.01:
                score_volatilidad = 0.8
            elif close >= bb_upper * 0.99:
                score_volatilidad = -0.8

    # ── Score: Volumen (0.20) ─────────────────────────────────────────────────
    score_volumen = 0.0
    if vwap:
        vol_score = 0.6 if close > vwap else -0.6
        if obv is not None:
            obv_series = df["obv"].dropna()
            if len(obv_series) >= 10:
                obv_trend = obv_series.iloc[-1] - obv_series.iloc[-10]
                if obv_trend > 0:
                    vol_score = min(1.0, vol_score + 0.2)
                else:
                    vol_score = max(-1.0, vol_score - 0.2)
        score_volumen = vol_score

    # ── Consolidated technical score ──────────────────────────────────────────
    score_tecnico = (
        0.30 * score_tendencia
        + 0.25 * score_momentum
        + 0.25 * score_volatilidad
        + 0.20 * score_volumen
    )

    return TechnicalSignals(
        sma_50=sma_50,
        sma_200=sma_200,
        ema_20=ema_20,
        rsi_14=rsi,
        macd=macd_val,
        macd_signal=macd_sig,
        macd_histogram=macd_hist_val,
        bb_upper=bb_upper,
        bb_middle=bb_middle,
        bb_lower=bb_lower,
        atr_14=atr,
        vwap=vwap,
        obv=obv,
        score_tendencia=round(score_tendencia, 4),
        score_momentum=round(score_momentum, 4),
        score_volatilidad=round(score_volatilidad, 4),
        score_volumen=round(score_volumen, 4),
        score_tecnico=round(score_tecnico, 4),
    )


def get_historical_ohlcv(ticker: str, period: str = "6mo") -> list[dict]:
    """Return OHLCV list for charting"""
    df = _get_historical_data(ticker, period=period)
    result = []
    for idx, row in df.iterrows():
        result.append({
            "time": int(idx.timestamp()),
            "open": round(float(row["open"]), 2),
            "high": round(float(row["high"]), 2),
            "low": round(float(row["low"]), 2),
            "close": round(float(row["close"]), 2),
            "volume": int(row["volume"]),
        })
    return result

