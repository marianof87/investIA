# IAinvestor 📊

**Plataforma de análisis inteligente de acciones** — Señales BUY/SELL/HOLD con análisis técnico, fundamental, sentimiento y riesgo geopolítico.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TradingView Lightweight Charts |
| Backend | Python + FastAPI |
| Indicadores | pandas_ta (local, 0 API calls) |
| Base de datos | SQLite (cache + GPR index) |

## Inicio Rápido

### 1. Instalar dependencias del backend
```powershell
cd backend
pip install -r requirements.txt
```

### 2. Instalar dependencias del frontend
```powershell
cd frontend
npm install
```

### 3. Iniciar ambos servidores
```powershell
# Desde la raíz del proyecto:
.\start.ps1
```

O manualmente:
```powershell
# Terminal 1 — Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend  
cd frontend
npm run dev
```

- **Frontend:** http://localhost:5173
- **API docs:** http://localhost:8000/docs

## API Keys (Opcionales)

La app funciona **sin keys** usando yfinance como fallback universal. Para datos en tiempo real, agrega las keys en `backend/.env`:

| Variable | Fuente | Gratis |
|---|---|---|
| `ALPACA_API_KEY` + `ALPACA_SECRET_KEY` | [alpaca.markets](https://alpaca.markets) | ✅ Paper Trading |
| `FINNHUB_TOKEN` | [finnhub.io](https://finnhub.io) | ✅ 60 req/min |
| `FMP_API_KEY` | [financialmodelingprep.com](https://financialmodelingprep.com) | ✅ 250/día |
| `ALPHA_VANTAGE_KEY` | [alphavantage.co](https://alphavantage.co) | ✅ 25/día |
| `TWELVE_DATA_KEY` | [twelvedata.com](https://twelvedata.com) | ✅ 800/día |

## Algoritmo de Scoring

```
SCORE_FINAL = 0.35 × técnico + 0.25 × fundamental + 0.20 × sentimiento + 0.20 × geopolítico

SCORE_FINAL > 0.6  → BUY
SCORE_FINAL < -0.6 → SELL
Otherwise          → HOLD
```

## ⚠️ Aviso Legal

Esta aplicación proporciona información educativa generada automáticamente. NO constituye asesoramiento financiero. Invertir implica riesgo de pérdida del capital. Consulte un asesor certificado antes de invertir.
