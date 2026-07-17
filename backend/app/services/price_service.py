"""
Price Service — Fallback Chain
Priority: Alpaca → Finnhub → yfinance
"""
import time
import httpx
import yfinance as yf
from app.config import get_settings
from app.db.database import get_connection
from app.models.analysis import PriceData

settings = get_settings()
STALE_THRESHOLD = settings.price_cache_ttl  # 30s
DISCREPANCY_THRESHOLD = 0.005               # 0.5%


def _cache_price(ticker: str, price: float, source: str):
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO price_cache (ticker, price, source, timestamp) VALUES (?,?,?,?)",
        (ticker, price, source, time.time()),
    )
    conn.commit()
    conn.close()


def _get_cached_price(ticker: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT price, source, timestamp FROM price_cache WHERE ticker=?", (ticker,)
    ).fetchone()
    conn.close()
    return row


async def _price_from_alpaca(ticker: str) -> float | None:
    if not settings.alpaca_api_key:
        return None
    try:
        url = f"{settings.alpaca_base_url}/v2/stocks/{ticker}/quotes/latest"
        headers = {
            "APCA-API-KEY-ID": settings.alpaca_api_key,
            "APCA-API-SECRET-KEY": settings.alpaca_secret_key,
        }
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(url, headers=headers)
            if r.status_code == 200:
                data = r.json()
                ap = data.get("quote", {}).get("ap", 0)
                bp = data.get("quote", {}).get("bp", 0)
                if ap and bp:
                    return (ap + bp) / 2
    except Exception:
        pass
    return None


async def _price_from_finnhub(ticker: str) -> float | None:
    if not settings.finnhub_token:
        return None
    try:
        url = f"https://finnhub.io/api/v1/quote?symbol={ticker}&token={settings.finnhub_token}"
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(url)
            if r.status_code == 200:
                data = r.json()
                price = data.get("c")
                if price and price > 0:
                    return float(price)
    except Exception:
        pass
    return None


def _price_from_yfinance(ticker: str) -> tuple[float | None, float | None]:
    """Returns (current_price, previous_close)"""
    try:
        tk = yf.Ticker(ticker)
        info = tk.fast_info
        price = getattr(info, "last_price", None) or getattr(info, "regular_market_price", None)
        prev = getattr(info, "previous_close", None)
        return price, prev
    except Exception:
        return None, None


async def get_current_price(ticker: str) -> PriceData:
    ticker = ticker.upper()
    discrepancy_alert = None

    # 1. Try Alpaca
    alpaca_price = await _price_from_alpaca(ticker)
    source = "Alpaca"
    price = alpaca_price

    # 2. Try Finnhub
    finnhub_price = await _price_from_finnhub(ticker)

    if price is None:
        price = finnhub_price
        source = "Finnhub"

    # Check discrepancy between Alpaca and Finnhub
    if alpaca_price and finnhub_price:
        diff = abs(alpaca_price - finnhub_price) / alpaca_price
        if diff > DISCREPANCY_THRESHOLD:
            discrepancy_alert = (
                f"⚠️ Discrepancia de precios: Alpaca ${alpaca_price:.2f} vs "
                f"Finnhub ${finnhub_price:.2f} ({diff*100:.2f}%)"
            )

    # 3. Fallback to yfinance
    prev_close = None
    if price is None:
        yf_price, prev_close = _price_from_yfinance(ticker)
        price = yf_price
        source = "yfinance (15min delay)"

    if price is None:
        # Check cache as last resort
        cached = _get_cached_price(ticker)
        if cached:
            return PriceData(
                ticker=ticker,
                price=cached["price"],
                source=f"{cached['source']} (cached)",
                stale=True,
                discrepancy_alert="⚠️ Datos en caché — no se pudo obtener precio actualizado",
            )
        raise ValueError(f"No se pudo obtener precio para {ticker}")

    # Cache the fresh price
    _cache_price(ticker, price, source)

    # Compute change %
    change_pct = None
    if prev_close and prev_close > 0:
        change_pct = ((price - prev_close) / prev_close) * 100

    return PriceData(
        ticker=ticker,
        price=price,
        previous_close=prev_close,
        change_pct=change_pct,
        source=source,
        stale=False,
        discrepancy_alert=discrepancy_alert,
    )
