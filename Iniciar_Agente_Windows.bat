@echo off
title AuraDock - Agente de Bandeja do Windows
cd /d "%~dp0"

echo ===================================================================
echo             AuraDock - Agente Nativo da Bandeja do Sistema
echo ===================================================================
echo.
echo  * Fica rodando silenciosamente na bandeja (perto do relogio)
echo  * Menu lateral transparente, com vidro jateado e curvas Bezier
echo  * Abra as configuracoes a qualquer momento pela bandeja ou dock
echo  * Ao salvar/fechar as configuracoes, volta direto para a bandeja
echo  * Atalho global no Windows: Ctrl + Espaco
echo.

:: 1. Instala dependencias caso o electron nao esteja presente
if not exist "node_modules\electron" (
    echo [1/3] Instalando dependencias do projeto e do Electron...
    echo (Aguarde alguns instantes, isso so acontece na primeira execucao)
    echo.
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERRO] Falha ao instalar dependencias com npm.
        echo Tente executar no terminal: npm install --legacy-peer-deps
        pause
        exit /b 1
    )
)

:: 2. Compila a interface caso dist nao exista
if not exist "dist\index.html" (
    echo [2/3] Compilando interface do AuraDock (dist)...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERRO] Falha ao compilar com 'npm run build'.
        pause
        exit /b 1
    )
)

:: 3. Inicia o Electron
echo.
echo [3/3] Iniciando agente AuraDock na bandeja do Windows...
echo [INFO] O icone aparecera perto do relogio do Windows.
echo [INFO] Pressione Ctrl + Espaco para alternar o menu lateral.
echo.

call npx electron electron/main.cjs
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] O processo do Electron foi encerrado.
    pause
)
exit
