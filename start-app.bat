@echo off
echo ========================================
echo   Zenny App - 개발 서버 시작
echo ========================================
echo.
echo [1] Expo 모바일 앱 시작 중...
echo.
cd /d "%~dp0apps\mobile"
npx expo start
