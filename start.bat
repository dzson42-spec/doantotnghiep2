@echo off
chcp 65001 >nul
title CineVite - Khoi Dong Web Dat Ve Xem Phim
color 0A
cls
echo ===================================================================
echo            HE THONG DAT VE XEM PHIM TRUC TUYEN CINEVITE
echo ===================================================================
echo.
echo [*] Buoc 1: Kiem tra va giai phong cong 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] Buoc 2: Dang khoi dong may chu web tai http://localhost:5173...
echo [*] Trinh duyet Google Chrome se tu dong mo len trong giay lat...
echo.
echo ===================================================================
echo     NHAN CTRL + C TRONG CUA SO NAY KHI MUON DUNG CHUONG TRINH
echo ===================================================================
echo.

npm run dev
pause
