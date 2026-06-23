@echo off
title Siscar Backend v2.0
color 0A

echo.
echo  ========================================
echo    SISCAR BACKEND - Iniciando servidor...
echo  ========================================
echo.

cd /d "%~dp0"

:: Verifica se node_modules existe
if not exist "node_modules\" (
    echo  [INSTALANDO DEPENDENCIAS...]
    echo  Aguarde, isso pode demorar 1-2 minutos na primeira vez.
    echo.
    npm install
    echo.
    echo  [DEPENDENCIAS INSTALADAS!]
    echo.
)

:: Inicia o servidor
echo  [SERVIDOR INICIANDO em http://localhost:3001]
echo.
echo  Para abrir o sistema, acesse:
echo  http://localhost:3001
echo.
echo  Pressione CTRL+C para parar o servidor.
echo.

node server.js

pause
