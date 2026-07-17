# IAinvestor — Start Script (PowerShell)
# Runs both backend (FastAPI) and frontend (Vite) simultaneously

Write-Host "IAinvestor — Iniciando servidores..." -ForegroundColor Cyan

# Backend
$backendCmd = "-NoExit -Command `"cd '$PSScriptRoot\backend'; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`""
Start-Process powershell -ArgumentList $backendCmd -WindowStyle Normal

# Give backend 2s to start
Start-Sleep -Seconds 2

# Frontend
$frontendCmd = "-NoExit -Command `"cd '$PSScriptRoot\frontend'; npm run dev`""
Start-Process powershell -ArgumentList $frontendCmd -WindowStyle Normal

Write-Host ""
Write-Host "Servidores iniciados!" -ForegroundColor Green
Write-Host "   Backend API:  http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "   Frontend App: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Abre http://localhost:5173 en tu navegador" -ForegroundColor Cyan
