# 📱 APK Android - App Interne RétroBus

## ⚡ Démarrage rapide

### 1. **Installer les prérequis**
- **Java 17+** : https://www.oracle.com/java/technologies/downloads/
- **Android Studio** : https://developer.android.com/studio
- **Variables d'environnement** : Lire la section "Configuration" ci-dessous

### 2. **Générer l'APK Debug** (pour tester)
```powershell
cd C:\Dev\RETROBUS_ESSONNE\interne
powershell .\build-apk-debug.ps1
```
**Résultat** : `.\android\app\build\outputs\apk\debug\app-debug.apk` (~80 MB)

### 3. **Générer l'APK Release** (pour production/distribution)
```powershell
powershell .\build-apk-release.ps1
```
**Résultat** : `.\android\app\build\outputs\apk\release\app-release-unsigned.apk` (~60 MB)

## 🔧 Configuration

### Variables d'environnement (Windows)

Ajouter ces variables (Paramètres → Variables d'environnement) :

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

## 📂 Structure

```
interne/
├── capacitor.config.ts           ← Configuration Capacitor
├── build-apk-debug.ps1           ← Script build Debug
├── build-apk-release.ps1         ← Script build Release
├── dist/                         ← Web build (généré)
├── android/                      ← Projet Android (généré)
│   └── app/build/outputs/apk/    ← 📱 LES APK SONT ICI
│       ├── debug/
│       │   └── app-debug.apk
│       └── release/
│           └── app-release-unsigned.apk
└── package.json
```

## 🚀 Workflow quotidien

**Modifier le code → Tester l'APK :**
```powershell
npm run build
npx cap sync android
powershell .\build-apk-debug.ps1
adb install .\android\app\build\outputs\apk\debug\app-debug.apk
```

**Ou simplement :**
```powershell
powershell .\build-apk-debug.ps1  # Tout automatisé !
```

## 📥 Installer sur téléphone

### Via USB (mode Debug)
```powershell
adb install .\android\app\build\outputs\apk\debug\app-debug.apk
```

### Via Android Studio Emulator
- Ouvrir Android Studio
- Créer/démarrer un émulateur
- Exécuter build depuis Android Studio

## 📝 Notes

- **App ID** : `fr.retrobus.essonne.interne`
- **Nom** : "RétroBus Interne"
- **Debug APK** : ~80 MB (non optimisé)
- **Release APK** : ~60 MB (minifié)

## ❓ Problèmes ?

- Java non trouvé ? → Installer JDK 17+
- Android SDK non trouvé ? → Configurer ANDROID_HOME
- Build échoue ? → Exécuter d'abord `npm run build`
- Emulator lent ? → Utiliser un appareil USB

---

**C'est prêt ! 🚀**
