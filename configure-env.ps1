#!/usr/bin/env powershell
# Script pour configurer les variables d'environnement Java et Android SDK

Write-Host "`n🔧 Configuration des Variables d'Environnement" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# 1. Déterminer le chemin Java
Write-Host "🔍 Recherche de Java JDK..." -ForegroundColor Yellow

$possibleJavaPaths = @(
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files\Java\jdk17*",
    "C:\Program Files (x86)\Java\jdk-17*",
    "C:\Program Files (x86)\Java\jdk17*"
)

$javaHome = $null
foreach ($path in $possibleJavaPaths) {
    $found = Get-Item $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $javaHome = $found.FullName
        break
    }
}

if ($null -eq $javaHome) {
    Write-Host "❌ Java JDK 17 n'a pas été trouvé" -ForegroundColor Red
    Write-Host "`n📖 Solution :" -ForegroundColor Yellow
    Write-Host "1. Télécharger Java JDK 17 : https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Gray
    Write-Host "2. Installer en acceptant l'installation par défaut" -ForegroundColor Gray
    Write-Host "3. Redémarrer PowerShell" -ForegroundColor Gray
    Write-Host "4. Réexécuter ce script" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Java trouvé : $javaHome" -ForegroundColor Green

# 2. Définir les variables d'environnement
Write-Host "`n⚙️ Configuration de JAVA_HOME..." -ForegroundColor Yellow

[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
$env:JAVA_HOME = $javaHome

Write-Host "✅ JAVA_HOME = $javaHome" -ForegroundColor Green

# 3. Ajouter au PATH si nécessaire
Write-Host "`n⚙️ Configuration du PATH..." -ForegroundColor Yellow

$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$javaBinPath = "$javaHome\bin"

if ($currentPath -notlike "*$javaBinPath*") {
    $newPath = "$javaBinPath;$currentPath"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    $env:PATH = "$javaBinPath;$env:PATH"
    Write-Host "✅ Ajouté au PATH : $javaBinPath" -ForegroundColor Green
} else {
    Write-Host "✅ Déjà dans le PATH" -ForegroundColor Green
}

# 4. Vérifier que Java fonctionne
Write-Host "`n📋 Vérification..." -ForegroundColor Yellow

$javaVersion = & java -version 2>&1
Write-Host "✅ $($javaVersion | Select-Object -First 1)" -ForegroundColor Green

# 5. Android SDK
Write-Host "`n🔍 Recherche d'Android SDK..." -ForegroundColor Yellow

$androidHome = $env:ANDROID_HOME
if ($null -eq $androidHome) {
    $possibleAndroidPaths = @(
        "$env:USERPROFILE\AppData\Local\Android\Sdk",
        "C:\Android\Sdk"
    )
    
    foreach ($path in $possibleAndroidPaths) {
        if (Test-Path $path) {
            $androidHome = $path
            break
        }
    }
}

if ($null -eq $androidHome) {
    Write-Host "⚠️ Android SDK n'a pas été trouvé" -ForegroundColor Yellow
    Write-Host "`n📖 Pour installer Android Studio :" -ForegroundColor Gray
    Write-Host "1. Télécharger : https://developer.android.com/studio" -ForegroundColor Gray
    Write-Host "2. Installer" -ForegroundColor Gray
    Write-Host "3. Lancer et installer les SDK tools" -ForegroundColor Gray
    Write-Host "4. Redémarrer PowerShell" -ForegroundColor Gray
} else {
    Write-Host "✅ Android SDK trouvé : $androidHome" -ForegroundColor Green
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "User")
    $env:ANDROID_HOME = $androidHome
}

Write-Host "`n✅ Configuration terminée !" -ForegroundColor Green
Write-Host "`n💡 Si vous avez juste installé Java, redémarrez PowerShell pour les changements d'effet." -ForegroundColor Yellow
Write-Host "Puis réexécutez votre script APK." -ForegroundColor Yellow
