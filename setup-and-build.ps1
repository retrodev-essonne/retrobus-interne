#!/usr/bin/env powershell
# Script de démarrage pour l'APK Release - Vérifie et installe les prérequis

Write-Host "`n🚀 Configuration Automatique - App Interne RétroBus" -ForegroundColor Green
Write-Host "==================================================`n" -ForegroundColor Green

# 1. Vérifier Java
Write-Host "1️⃣ Vérification de Java..." -ForegroundColor Cyan
$javaTest = & { java -version 2>&1 } -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0 -or $null -eq $javaTest) {
    Write-Host "❌ Java n'est pas trouvé - Installation..." -ForegroundColor Red
    Write-Host "`nExécutez d'abord ce script :" -ForegroundColor Yellow
    Write-Host "  powershell .\install-java.ps1" -ForegroundColor Cyan
    Write-Host "`nPuis redémarrez PowerShell et relancez ce script." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Java trouvé" -ForegroundColor Green
}

# 2. Configurer l'environnement
Write-Host "`n2️⃣ Configuration de l'environnement..." -ForegroundColor Cyan
& powershell .\configure-env.ps1
if ($LASTEXITCODE -ne 0) {
    exit 1
}

# 3. Maintenant exécuter le build Release
Write-Host "`n3️⃣ Lancement du build APK Release..." -ForegroundColor Cyan
Write-Host "`nFaites Ctrl+C si vous ne voulez pas continuer`n" -ForegroundColor Yellow

Start-Sleep -Seconds 3

& powershell .\build-apk-release.ps1
