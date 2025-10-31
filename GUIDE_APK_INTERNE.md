# 📱 Guide Complet APK - App Interne RétroBus

## ✅ Configuration Complétée

Capacitor a été initialisé pour l'app interne :
- ✅ `capacitor.config.ts` créé
- ✅ Dossier `android/` généré avec Gradle
- ✅ Web build synchronisé (`dist/` → `android/`)
- ✅ Scripts PowerShell d'automatisation créés

## 🎯 Démarrage Rapide (5 minutes)

### 1. Installer Java JDK 17+

**Télécharger** :
https://www.oracle.com/java/technologies/downloads/

**Ou via Chocolatey** (Windows) :
```powershell
choco install openjdk17
```

### 2. Installer Android Studio

**Télécharger** :
https://developer.android.com/studio

**Lors de l'installation**, cocher :
- ✓ Android SDK
- ✓ Android SDK Build Tools (34.0.0+)
- ✓ Android SDK Platform (API 34+)
- ✓ Emulator (optionnel)
- ✓ NDK (optionnel)

### 3. Configurer les variables d'environnement

**Windows** → Paramètres → Variables d'environnement (Éditer)

Ajouter :
```
ANDROID_HOME = C:\Users\[VotreNom]\AppData\Local\Android\Sdk
JAVA_HOME    = C:\Program Files\Java\jdk-17.x.x
```

Ajouter au PATH :
```
%ANDROID_HOME%\tools
%ANDROID_HOME%\platform-tools
%JAVA_HOME%\bin
```

### 4. Générer l'APK Debug

```powershell
cd C:\Dev\RETROBUS_ESSONNE\interne
powershell .\build-apk-debug.ps1
```

**Résultat** : `.\android\app\build\outputs\apk\debug\app-debug.apk`

### 5. Installer sur téléphone/emulator

```powershell
adb install .\android\app\build\outputs\apk\debug\app-debug.apk
```

## 🔧 Processus Complet

### Phase 1️⃣ : Développement
```powershell
npm run dev          # Tester en local sur http://localhost:5173
npm run build        # Générer dist/
```

### Phase 2️⃣ : Build Android
```powershell
npx cap sync android # Synchroniser dist/ → android/
npx cap open android # Ouvrir dans Android Studio (optionnel)
```

### Phase 3️⃣ : Générer APK
```powershell
powershell .\build-apk-debug.ps1    # Pour tester
powershell .\build-apk-release.ps1  # Pour production
```

### Phase 4️⃣ : Installation
```powershell
adb install app-debug.apk        # Via USB
# Ou via Android Studio Emulator
```

## 📱 Tailles Approximatives

```
dist/                    ~5 MB    (Web build)
android/                 ~300 MB  (Gradle cache)
app-debug.apk            ~80 MB   (APK Debug)
app-release-unsigned.apk ~60 MB   (APK Release, minifié)
```

## 🎨 Personnaliser l'App

### Changer le nom
`android/app/src/main/res/values/strings.xml` :
```xml
<resources>
    <string name="app_name">RétroBus Interne</string>
</resources>
```

### Changer l'icône
Remplacer les fichiers dans :
```
android/app/src/main/res/
├── mipmap-ldpi/ic_launcher.png
├── mipmap-mdpi/ic_launcher.png
├── mipmap-hdpi/ic_launcher.png
├── mipmap-xhdpi/ic_launcher.png
├── mipmap-xxhdpi/ic_launcher.png
└── mipmap-xxxhdpi/ic_launcher.png
```

### Changer les couleurs
`android/app/src/main/res/values/colors.xml` :
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#1a202c</color>
    <color name="ic_launcher_foreground">#ffffff</color>
</resources>
```

## 🔐 Signer l'APK pour Google Play Store

### Créer une clé de signature (une seule fois)

```powershell
keytool -genkey -v -keystore retrobus-interne.keystore `
  -keyalg RSA -keysize 2048 -validity 10000 -alias retrobus_interne `
  -storepass [VotreMotDePasse] -keypass [VotreMotDePasse] `
  -dname "CN=RétroBus Interne, O=Association, L=Essonne, C=FR"
```

### Configurer Gradle pour signer

`android/app/build.gradle.kts` - Ajouter après `android { }` :

```kotlin
signingConfigs {
    create("release") {
        storeFile = file("../retrobus-interne.keystore")
        storePassword = "VotreMotDePasse"
        keyAlias = "retrobus_interne"
        keyPassword = "VotreMotDePasse"
    }
}

buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release")
    }
}
```

### Générer l'APK signé

```powershell
powershell .\build-apk-release.ps1
```

Résultat : `app-release-unsigned.apk` (signé et optimisé)

## 📲 Publier sur Google Play Store

1. Créer compte Google Play Developer ($25)
2. Générer APK Release signé
3. Charger sur Google Play Console
4. Remplir les infos de l'app
5. Soumettre pour review

## 🐛 Dépannage

### ❌ "java: not found"
- Installer JDK 17+ : https://www.oracle.com/java/technologies/downloads/
- Configurer JAVA_HOME

### ❌ "ANDROID_HOME not set"
- Installer Android Studio
- Configurer ANDROID_HOME (voir section Configuration)

### ❌ "Gradle build failed"
```powershell
# Nettoyer et reconstruire
cd android
./gradlew clean build
cd ..
```

### ❌ "APK trop volumineux"
- Activer minification dans Gradle
- Code splitting (dynamic imports)
- WebP pour les images

### ❌ Emulator très lent
- Utiliser un appareil physique USB
- Activer l'accélération matérielle dans Android Studio
- Utiliser un emulator arm64

## 📚 Documentation

- `APK_README.md` - Démarrage rapide
- `capacitor.config.ts` - Configuration Capacitor
- `build-apk-debug.ps1` - Script build Debug
- `build-apk-release.ps1` - Script build Release

## 🔗 Ressources

- Capacitor : https://capacitorjs.com/docs
- Android Studio : https://developer.android.com/docs
- Google Play : https://play.google.com/console
- Gradle : https://gradle.org/

## ✨ Recap

| Étape | Commande | Résultat |
|-------|----------|----------|
| Builder | `npm run build` | dist/ créé |
| Sync | `npx cap sync android` | dist/ → android/ |
| APK Debug | `powershell .\build-apk-debug.ps1` | app-debug.apk |
| APK Release | `powershell .\build-apk-release.ps1` | app-release-unsigned.apk |
| Install | `adb install app.apk` | App sur téléphone |

---

**C'est tout ! Prêt à générer votre APK ? 🚀**
