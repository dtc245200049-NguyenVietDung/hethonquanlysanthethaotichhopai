@echo off
chcp 65001 >nul
title Khởi động Hệ thống SportAI
echo ==============================================================
echo    🏆 HỆ THỐNG QUẢN LÝ SÂN THỂ THAO TÍCH HỢP AI (SPORTAI)
echo    Khởi động Backend (Port 3000) và Web App (Port 5173)...
echo ==============================================================

start "SportAI Backend (Port 3000)" cmd /k "cd backend && node server.js"
timeout /t 2 >nul
start "SportAI Web App (Port 5173)" cmd /k "cd webapp && npm run dev"
timeout /t 2 >nul

echo.
echo ✅ ĐÃ BẬT CẢ 2 SERVER THÀNH CÔNG!
echo 🌐 Đang tự động mở Giao diện Web App tại: http://localhost:5173
echo.
start http://localhost:5173

