@echo off
echo Iniciando EarnFlow (Backend + Frontend)...
start cmd /k "cd server && node index.js"
echo Servidor Backend iniciado en http://localhost:3001
echo.
echo PARA ACCEDER DESDE TU CELULAR:
echo 1. Asegurate que tu celular este en el mismo Wi-Fi.
echo 2. Abre el navegador en tu celular y entra a: http://172.20.10.8:5173
echo.
echo Iniciando Frontend...
npm run dev
pause
