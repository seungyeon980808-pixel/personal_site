@echo off
cd /d "%~dp0"
echo 로컬 서버를 엽니다... (종료하려면 이 창을 닫으세요)
start "" http://localhost:3000
npx serve
pause
