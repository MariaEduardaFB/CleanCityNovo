# Script para configurar ambiente Android e iniciar emulador
# Execute este script sempre que abrir um novo terminal PowerShell

Write-Host "🔧 Configurando variáveis de ambiente Android..." -ForegroundColor Cyan

# Configurar ANDROID_HOME
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:Path;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin"

Write-Host "✅ ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green

# Verificar se Android SDK existe
if (Test-Path $env:ANDROID_HOME) {
    Write-Host "✅ Android SDK encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Android SDK não encontrado em $env:ANDROID_HOME" -ForegroundColor Red
    exit 1
}

# Listar emuladores disponíveis
Write-Host "`n📱 Emuladores disponíveis:" -ForegroundColor Cyan
& "$env:ANDROID_HOME\emulator\emulator.exe" -list-avds

Write-Host "`n🚀 Para iniciar o emulador, use:" -ForegroundColor Yellow
Write-Host "   emulator -avd Medium_Phone" -ForegroundColor White

Write-Host "`n🔍 Para verificar dispositivos conectados:" -ForegroundColor Yellow
Write-Host "   adb devices" -ForegroundColor White

Write-Host "`n📦 Para rodar o projeto:" -ForegroundColor Yellow
Write-Host "   npx expo start" -ForegroundColor White
Write-Host "   Depois pressione 'a' para Android" -ForegroundColor White
