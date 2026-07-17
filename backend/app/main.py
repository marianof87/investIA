"""
FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.db.database import init_db
from app.routes import analysis, historical

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[IAinvestor] Initializing database...")
    init_db()
    print("[IAinvestor] Backend ready!")
    yield
    # Shutdown
    print("[IAinvestor] Shutting down...")


app = FastAPI(
    title="IAinvestor API",
    description="Multi-source stock analysis engine — BUY/SELL/HOLD signals",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(analysis.router)
app.include_router(historical.router)


@app.get("/")
async def root():
    return {
        "app": "IAinvestor",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": __import__("datetime").datetime.utcnow().isoformat()}
