#!/usr/bin/env powershell
# Script pour installer Java JDK 17 automatiquement

Write-Host "`n🚀 Installation de Java JDK 17 pour RétroBus" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# Vérifier si Java est déjà installé
Write-Host "📋 Vérification de Java..." -ForegroundColor Yellow
$javaTest = & { java -version 2>&1 | Select-Object -First 1 } -ErrorAction SilentlyContinue

if ($javaTest -and $javaTest -match "version") {
    Write-Host "✅ Java est déjà installé : $javaTest" -ForegroundColor Green
    exit 0
}

Write-Host "❌ Java n'est pas installé" -ForegroundColor Red
Write-Host "`n📥 Téléchargement et installation de Java JDK 17..." -ForegroundColor Yellow

# URL de téléchargement Java
$javaDownloadUrl = "https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.msi"
$outputPath = "$env:TEMP\jdk-17.msi"

try {
    Write-Host "📥 Téléchargement... (cela peut prendre 1-2 minutes)" -ForegroundColor Cyan
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $javaDownloadUrl -OutFile $outputPath -UseBasicParsing
    
    Write-Host "✅ Téléchargement terminé" -ForegroundColor Green
    Write-Host "`n⚙️ Installation en cours... (cela peut prendre 2-3 minutes)" -ForegroundColor Cyan
    
    # Installer silencieusement
    Start-Process -FilePath msiexec.exe -ArgumentList "/i `"$outputPath`" /qn /norestart" -Wait
    
    Write-Host "✅ Installation terminée" -ForegroundColor Green
    
    # Nettoyer
    Remove-Item $outputPath -Force -ErrorAction SilentlyContinue
    
    Write-Host "`n⚠️ Veuillez redémarrer PowerShell pour que les changements prennent effet" -ForegroundColor Yellow
    Write-Host "Après redémarrage, exécutez à nouveau votre script APK" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ Erreur lors du téléchargement/installation : $_" -ForegroundColor Red
    Write-Host "`n📖 Solution alternative :" -ForegroundColor Yellow
    Write-Host "1. Télécharger Java JDK 17 manuellement :" -ForegroundColor Gray
    Write-Host "   https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Cyan
    Write-Host "`n2. Installer en double-cliquant sur le fichier .msi" -ForegroundColor Gray
    Write-Host "`n3. Redémarrer PowerShell" -ForegroundColor Gray
    Write-Host "`n4. Réessayer votre script APK" -ForegroundColor Gray
    exit 1
}
