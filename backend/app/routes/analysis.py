"""
Analysis Route — Main orchestrator endpoint
POST /api/analyze/{ticker}?capital=10000
"""
import asyncio
import time
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from app.models.analysis import AnalysisResponse
from app.services.price_service import get_current_price
from app.services.technical_service import compute_technical_signals
from app.services.fundamental_service import get_fundamental_data
from app.services.sentiment_service import get_sentiment_data
from app.services.geopolitical_service import get_geopolitical_data
from app.services.scoring_engine import (
    compute_final_score, get_recommendation, select_order_type,
    compute_position_sizing, get_disclaimer
)
from app.db.database import get_connection

router = APIRouter()


@router.get("/api/analyze/{ticker}", response_model=AnalysisResponse)
async def analyze_ticker(
    ticker: str,
    capital: float = Query(default=10000.0, ge=100.0, description="Capital disponible en USD")
):
    ticker = ticker.upper().strip()

    try:
        # ── Run IO-bound tasks concurrently ───────────────────────────────────
        price_task = asyncio.create_task(get_current_price(ticker))
        fundamental_task = asyncio.create_task(get_fundamental_data(ticker))
        sentiment_task = asyncio.create_task(get_sentiment_data(ticker))

        # Technical is CPU-bound but uses yfinance IO — run in thread
        loop = asyncio.get_event_loop()
        technical_future = loop.run_in_executor(
            None, compute_technical_signals, ticker
        )

        price_data, fundamental_data, sentiment_data, technical_data = await asyncio.gather(
            price_task, fundamental_task, sentiment_task, technical_future
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de análisis: {str(e)}")

    # ── Geopolitical (synchronous — local SQLite) ──────────────────────────
    geo_data, geo_score = get_geopolitical_data(fundamental_data.sector)

    # ── Final score ────────────────────────────────────────────────────────
    score_final = compute_final_score(
        score_tecnico=technical_data.score_tecnico,
        score_fundamental=fundamental_data.score_fundamental,
        score_sentimiento=sentiment_data.score,
        score_geopolitico=geo_score,
    )

    recommendation, confidence = get_recommendation(score_final)

    # ── Order type selection ───────────────────────────────────────────────
    order_config = select_order_type(
        technical=technical_data,
        recommendation=recommendation,
        current_price=price_data.price,
        geo_data=geo_data,
    )

    # ── Position sizing ────────────────────────────────────────────────────
    atr = technical_data.atr_14 or (price_data.price * 0.02)
    position = compute_position_sizing(
        current_price=price_data.price,
        atr=atr,
        capital=capital,
        recommendation=recommendation,
    )

    # ── Save to history ────────────────────────────────────────────────────
    try:
        conn = get_connection()
        conn.execute(
            "INSERT INTO analysis_history (ticker, score_final, recommendation, order_type, timestamp) VALUES (?,?,?,?,?)",
            (ticker, score_final, recommendation, order_config.order_type, time.time()),
        )
        conn.commit()
        conn.close()
    except Exception:
        pass

    return AnalysisResponse(
        ticker=ticker,
        timestamp=datetime.utcnow().isoformat() + "Z",
        price=price_data,
        technical=technical_data,
        fundamental=fundamental_data,
        sentiment=sentiment_data,
        geopolitical=geo_data,
        score_tecnico=technical_data.score_tecnico,
        score_fundamental=fundamental_data.score_fundamental,
        score_sentimiento=sentiment_data.score,
        score_geopolitico=geo_score,
        score_final=score_final,
        recommendation=recommendation,
        confidence=confidence,
        order=order_config,
        position=position,
        disclaimer=get_disclaimer(),
    )
