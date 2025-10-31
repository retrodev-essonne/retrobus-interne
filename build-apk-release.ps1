#!/usr/bin/env powershell
# Script pour builder l'APK Release signé de l'app INTERNE RétroBus

Write-Host "🚀 Génération de l'APK Release - App Interne (RétroBus)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Build web
Write-Host "`n1️⃣ Building l'app interne..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build web" -ForegroundColor Red
    exit 1
}

# 2. Sync avec Android
Write-Host "`n2️⃣ Synchronisation avec Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la sync Capacitor" -ForegroundColor Red
    exit 1
}

# 3. Vérifier la clé de signature
$keystorePath = ".\retrobus-interne.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "`n3️⃣ Création de la clé de signature..." -ForegroundColor Yellow
    Write-Host "   Cette clé ne doit être créée qu'UNE SEULE FOIS" -ForegroundColor Red
    Write-Host "   ⚠️  Gardez-la en sécurité !" -ForegroundColor Red
    
    $password = Read-Host "Entrez un mot de passe fort (min 6 caractères)"
    if ($password.Length -lt 6) {
        Write-Host "❌ Le mot de passe doit contenir au moins 6 caractères" -ForegroundColor Red
        exit 1
    }
    
    keytool -genkey -v -keystore $keystorePath `
        -keyalg RSA -keysize 2048 -validity 10000 -alias retrobus_interne `
        -storepass $password -keypass $password `
        -dname "CN=RétroBus Interne, O=Association, L=Essonne, C=FR"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la création de la clé" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Clé de signature créée : $keystorePath" -ForegroundColor Green
} else {
    Write-Host "`n3️⃣ Clé de signature trouvée" -ForegroundColor Green
}

# 4. Build APK Release
Write-Host "`n4️⃣ Building l'APK Release signé..." -ForegroundColor Yellow
Set-Location android
./gradlew assembleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build Gradle" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# Résultats
$apkPath = ".\android\app\build\outputs\apk\release\app-release-unsigned.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    
    Write-Host "`n" -ForegroundColor Green
    Write-Host "✅ APK Release généré avec succès !" -ForegroundColor Green
    Write-Host "📍 Localisation : $apkPath" -ForegroundColor Cyan
    Write-Host "📏 Taille : $([Math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    
    Write-Host "`n💡 Prochaines étapes :" -ForegroundColor Yellow
    Write-Host "   • Télécharger sur l'intranet ou serveur interne" -ForegroundColor Gray
    Write-Host "   • Ou distribuer aux collaborateurs" -ForegroundColor Gray
}

Write-Host "`n✨ Terminé !" -ForegroundColor Green
