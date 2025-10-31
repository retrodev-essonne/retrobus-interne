# 🔧 Guide d'Installation - Java JDK 17

## ❌ Problème

```
keytool : Le terme «keytool» n'est pas reconnu...
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

**Cause** : Java JDK n'est pas installé ou pas configuré dans le PATH.

## ✅ Solutions

### Solution 1️⃣ : Installation Automatique (Recommandé)

```powershell
cd C:\Dev\RETROBUS_ESSONNE\interne

# Installer Java automatiquement
powershell .\install-java.ps1

# Redémarrer PowerShell (fermer et rouvrir)

# Configurer l'environnement
powershell .\configure-env.ps1

# Relancer le build
powershell .\build-apk-release.ps1
```

### Solution 2️⃣ : Installation Manuelle

#### Étape 1 : Télécharger Java JDK 17

https://www.oracle.com/java/technologies/downloads/

Chercher "**JDK 17**" et télécharger la version pour **Windows x64** (fichier `.msi`)

#### Étape 2 : Installer

1. Double-cliquer sur le fichier `.msi`
2. Suivre l'installation (accepter par défaut)
3. Installation dans : `C:\Program Files\Java\jdk-17.x.x` (par défaut)

#### Étape 3 : Configurer l'environnement

**Windows** → Paramètres → Variables d'environnement

Ajouter :
```
JAVA_HOME = C:\Program Files\Java\jdk-17.0.x
```

Ajouter au **PATH** :
```
C:\Program Files\Java\jdk-17.0.x\bin
```

#### Étape 4 : Redémarrer PowerShell

Fermer la fenêtre PowerShell et en ouvrir une nouvelle.

#### Étape 5 : Vérifier

```powershell
java -version
```

Devrait afficher : `openjdk version "17.x.x"`

#### Étape 6 : Relancer le build

```powershell
cd C:\Dev\RETROBUS_ESSONNE\interne
powershell .\build-apk-release.ps1
```

### Solution 3️⃣ : Script tout-en-un

```powershell
cd C:\Dev\RETROBUS_ESSONNE\interne
powershell .\setup-and-build.ps1
```

Ce script va :
1. ✅ Vérifier Java
2. ✅ L'installer si absent
3. ✅ Configurer l'environnement
4. ✅ Relancer le build

## 📋 Vérification

Après l'installation, dans PowerShell :

```powershell
java -version
```

Devrait retourner quelque chose comme :

```
openjdk version "17.0.9" 2023-10-17
OpenJDK Runtime Environment Temurin-17.0.9+9 (build 17.0.9+9)
OpenJDK 64-Bit Server VM Temurin-17.0.9+9 (build 17.0.9+9, mixed mode, sharing)
```

## 🆘 Ça ne marche toujours pas ?

1. **Redémarrer l'ordinateur** (parfois nécessaire pour les variables d'environnement)
2. **Vérifier manuellement le chemin Java** :
   - Ouvrir l'Explorateur Windows
   - Aller dans `C:\Program Files\Java\`
   - Vérifier qu'il y a un dossier `jdk-17.x.x`

3. **Si absent, télécharger et installer manuellement** :
   - https://www.oracle.com/java/technologies/downloads/
   - Sélectionner **JDK 17** → **Windows x64** → **Installer manuellement**

4. **Relancer PowerShell après chaque changement**

## 📞 Ressources

- Java JDK 17 : https://www.oracle.com/java/technologies/downloads/
- Configuration Windows : https://docs.oracle.com/en/java/javase/17/install/windows-jdk-installation-guide.html
- Keytool (signature) : https://docs.oracle.com/en/java/javase/17/docs/specs/man/keytool.html

---

**C'est bon ? Relancez votre build ! 🚀**
