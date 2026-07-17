"""
Fundamental Analysis Service
Priority: FMP API → yfinance fallback
"""
import time
import httpx
import yfinance as yf
from app.config import get_settings
from app.db.database import get_connection
from app.models.analysis import FundamentalData

settings = get_settings()

SECTOR_PE_AVERAGES = {
    "Technology": 28.0,
    "Healthcare": 22.0,
    "Financial Services": 15.0,
    "Consumer Cyclical": 20.0,
    "Consumer Defensive": 18.0,
    "Energy": 12.0,
    "Industrials": 20.0,
    "Basic Materials": 14.0,
    "Real Estate": 35.0,
    "Utilities": 18.0,
    "Communication Services": 22.0,
    "default": 20.0,
}


def _get_cached_fundamentals(ticker: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM fundamental_cache WHERE ticker=?", (ticker,)
    ).fetchone()
    conn.close()
    if row and (time.time() - row["timestamp"]) < settings.fundamental_cache_ttl:
        return dict(row)
    return None


def _cache_fundamentals(ticker: str, data: dict, source: str):
    conn = get_connection()
    conn.execute(
        """INSERT OR REPLACE INTO fundamental_cache
           (ticker, pe_ratio, revenue_growth, debt_equity, sector, market_cap, source, timestamp)
           VALUES (?,?,?,?,?,?,?,?)""",
        (
            ticker,
            data.get("pe_ratio"),
            data.get("revenue_growth"),
            data.get("debt_equity"),
            data.get("sector", "default"),
            data.get("market_cap"),
            source,
            time.time(),
        ),
    )
    conn.commit()
    conn.close()


async def _fundamentals_from_fmp(ticker: str) -> dict | None:
    if not settings.fmp_api_key:
        return None
    try:
        url = f"https://financialmodelingprep.com/api/v3/profile/{ticker}?apikey={settings.fmp_api_key}"
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(url)
            if r.status_code == 200:
                data = r.json()
                if data and isinstance(data, list) and len(data) > 0:
                    p = data[0]
                    return {
                        "pe_ratio": p.get("pe"),
                        "sector": p.get("sector", "default"),
                        "market_cap": p.get("mktCap"),
                    }
    except Exception:
        pass

    # Also fetch income statement for growth
    try:
        url2 = (
            f"https://financialmodelingprep.com/api/v3/income-statement/{ticker}"
            f"?limit=2&apikey={settings.fmp_api_key}"
        )
        async with httpx.AsyncClient(timeout=8) as client:
            r2 = await client.get(url2)
            if r2.status_code == 200:
                income = r2.json()
                if len(income) >= 2:
                    rev_curr = income[0].get("revenue", 0)
                    rev_prev = income[1].get("revenue", 1)
                    growth = (rev_curr - rev_prev) / rev_prev if rev_prev else 0
                    return {"revenue_growth": growth}
    except Exception:
        pass
    return None


def _fundamentals_from_yfinance(ticker: str) -> dict:
    tk = yf.Ticker(ticker)
    info = tk.info
    return {
        "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
        "revenue_growth": info.get("revenueGrowth"),
        "debt_equity": info.get("debtToEquity"),
        "sector": info.get("sector", "default"),
        "market_cap": info.get("marketCap"),
    }


def _score_fundamentals(pe: float | None, sector: str, rev_growth: float | None, de: float | None) -> float:
    score = 0.0
    sector_avg_pe = SECTOR_PE_AVERAGES.get(sector, SECTOR_PE_AVERAGES["default"])

    # P/E vs sector (40%)
    if pe and pe > 0:
        pe_ratio_normalized = sector_avg_pe / pe  # >1 = cheap, <1 = expensive
        pe_score = min(1.0, max(-1.0, (pe_ratio_normalized - 1) * 2))
        score += 0.40 * pe_score

    # Revenue growth (30%)
    if rev_growth is not None:
        if rev_growth > 0.20:
            growth_score = 1.0
        elif rev_growth > 0.10:
            growth_score = 0.6
        elif rev_growth > 0.0:
            growth_score = 0.2
        elif rev_growth > -0.10:
            growth_score = -0.4
        else:
            growth_score = -1.0
        score += 0.30 * growth_score

    # Debt/Equity (30%) — lower is better
    if de is not None:
        if de < 0.3:
            de_score = 1.0
        elif de < 0.6:
            de_score = 0.5
        elif de < 1.0:
            de_score = 0.0
        elif de < 2.0:
            de_score = -0.5
        else:
            de_score = -1.0
        score += 0.30 * de_score

    return round(score, 4)


async def get_fundamental_data(ticker: str) -> FundamentalData:
    # Check cache
    cached = _get_cached_fundamentals(ticker)
    if cached:
        score = _score_fundamentals(
            cached.get("pe_ratio"), cached.get("sector", "default"),
            cached.get("revenue_growth"), cached.get("debt_equity")
        )
        return FundamentalData(
            pe_ratio=cached.get("pe_ratio"),
            pe_sector_avg=SECTOR_PE_AVERAGES.get(cached.get("sector", "default"), 20.0),
            revenue_growth=cached.get("revenue_growth"),
            debt_equity=cached.get("debt_equity"),
            sector=cached.get("sector", "default"),
            market_cap=cached.get("market_cap"),
            source=f"{cached.get('source')} (cached)",
            score_fundamental=score,
        )

    # Try FMP
    fmp_data = await _fundamentals_from_fmp(ticker)
    if fmp_data:
        yf_data = _fundamentals_from_yfinance(ticker)  # fill missing fields
        merged = {**yf_data, **fmp_data}
        source = "FMP + yfinance"
    else:
        merged = _fundamentals_from_yfinance(ticker)
        source = "yfinance"

    _cache_fundamentals(ticker, merged, source)

    score = _score_fundamentals(
        merged.get("pe_ratio"), merged.get("sector", "default"),
        merged.get("revenue_growth"), merged.get("debt_equity")
    )
    sector = merged.get("sector", "default")

    return FundamentalData(
        pe_ratio=merged.get("pe_ratio"),
        pe_sector_avg=SECTOR_PE_AVERAGES.get(sector, 20.0),
        revenue_growth=merged.get("revenue_growth"),
        debt_equity=merged.get("debt_equity"),
        sector=sector,
        market_cap=merged.get("market_cap"),
        source=source,
        score_fundamental=score,
    )
