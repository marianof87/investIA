"""Historical data route for candlestick charts"""
from fastapi import APIRouter, HTTPException, Query
from app.services.technical_service import get_historical_ohlcv

router = APIRouter()


@router.get("/api/historical/{ticker}")
async def get_historical(
    ticker: str,
    period: str = Query(default="6mo", description="Period: 1mo, 3mo, 6mo, 1y, 2y")
):
    valid_periods = {"1mo", "3mo", "6mo", "1y", "2y"}
    if period not in valid_periods:
        raise HTTPException(status_code=400, detail=f"Period must be one of: {valid_periods}")
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(None, get_historical_ohlcv, ticker.upper(), period)
        return {"ticker": ticker.upper(), "period": period, "data": data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
