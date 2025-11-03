# 🚀 RétroPlanning v2.0 - Quick Start

## ⚡ 30 secondes pour commencer

### 1️⃣ Accéder
```
MyRBE → Carte orange "RétroPlanning" → CLIC
```

### 2️⃣ Créer un événement
```
+ Nouvel événement
  ↓
Étape 1: Titre + Type + Date
  ↓
Étape 2: Bus & Chauffeur (optionnel)
  ↓
Étape 3: Partager avec membres (optionnel)
  ↓
Étape 4: Résumé → Créer
```

### 3️⃣ Voir & Gérer
- 📅 Vue Calendrier
- 📋 Vue Liste
- 🔍 Rechercher
- 🏷️ Filtrer par type

---

## 📝 Exemples

### Créer une tournée avec affectation
```
1. Titre: "Tournée Villabé"
2. Type: 🚌 Tournée
3. Date: 15/02/2025
4. Heure: 09:00 - 17:00
5. Bus: XYZ-123 (Iveco)
6. Chauffeur: Jean Dupont
7. Notes: "Trajet habituel"
8. Créer → ✅ Fait !
```

### Créer un événement partagé
```
1. Titre: "Réunion équipe"
2. Type: 👥 Événement
3. Date: 20/02/2025
4. Pas d'affectation
5. ✅ Partager
6. Inviter: Jean, Marie, Paul
7. Message: "N'oubliez pas !"
8. Créer → 📧 Emails envoyés !
```

### Créer une campagne newsletter
```
1. Titre: "Campagne février"
2. Type: 📧 Campagne
3. Date: 01/02/2025
4. Créer → ✅ Fait !
```

---

## 🎨 Formulaire en 4 étapes

```
┌─────────────────────────────────────┐
│ ✨ Nouvel événement                 │
│ Étape 1/4                           │
├─────────────────────────────────────┤
│                                     │
│ Titre           [______________]   │
│ Type            [🚌 Tournée    ▼]  │
│ Date            [______________]   │
│ Heure début     [09:00]             │
│ Heure fin       [17:00]             │
│ Description     [____________...]   │
│                                     │
├─────────────────────────────────────┤
│ [Annuler]    [Suivant →]           │
└─────────────────────────────────────┘
```

---

## 🎯 Features clés

✅ **Tout en un formulaire**
- Plus besoin de 3 modals !
- Flux logique et clair
- Résumé avant validation

✅ **Affectations**
- Sélectionner un bus
- Sélectionner un chauffeur
- Ajouter des notes

✅ **Invitations par email**
- Sélectionner les membres
- Message personnalisé
- Lien de confirmation automatique

✅ **Calendrier moderne**
- Vue mois complète
- Vue liste détaillée
- Recherche & filtres

✅ **Style MyRBE**
- Design cohérent
- Responsive (mobile OK)
- Gradient orange/rouge

---

## 📊 Types d'événements

| Icône | Type | Usage |
|-------|------|-------|
| 📧 | Campagne | Newsletters, communications |
| 🚌 | Tournée | Trajets, collectes, distributions |
| 🔧 | Maintenance | Révisions véhicules |
| 👥 | Événement | Réunions, formations, activités |
| 📦 | Livraison | Arrivées de matériel |
| 💰 | Cotisation | Échéances de paiement |

---

## 🔍 Filtres & Recherche

```
🔍 Rechercher par titre
Type: [Tous les types ▼]
     → Sélectionner une catégorie
```

**Résultats** : Liste triée par date

---

## 💬 Statuts de présence

Quand **partagé** :
- ✓ Confirmé (vert)
- ? En attente (jaune)
- ✗ Refusé (rouge)

Visible dans la liste :
```
🔓 Partagé
✓ 3 confirmés
• Jean Dupont
• Marie Martin
+1 autre
```

---

## ⌨️ Raccourcis

| Action | Clavier |
|--------|---------|
| Créer | `+ Nouvel événement` |
| Voir détails | 👁️ Icon |
| Supprimer | 🗑️ Icon |
| Actualiser | `Actualiser` |

---

## ⚠️ À savoir

- **Titre & Date** = Requis
- **Bus & Chauffeur** = Optionnel mais ensemble
- **Partage** = Envoie automatiquement les emails
- **Confirmation** = Lien par email pour valider

---

## 📧 Email automatique reçu

```
De: noreply@retrobus.fr
Objet: Invitation à un événement RétroBus

─────────────────────────
📅 Invitation à un événement RétroBus
─────────────────────────

Bonjour Jean,

Vous êtes invité à l'événement suivant :

Événement : Tournée Villabé
Date : 15 février 2025

Veuillez confirmer votre présence en 
cliquant sur le bouton ci-dessous :

[Confirmer ma présence]

─────────────────────────
© RétroBus Essonne 2025
```

---

## 🆘 Problèmes courants

### "Je ne vois pas les membres"
→ Vérifier que les membres sont créés dans `Gestion des adhésions`

### "Les emails ne s'envoient pas"
→ Vérifier les variables SMTP_* dans `.env` backend

### "Je ne peux pas créer l'événement"
→ Remplir au minimum: Titre + Type + Date

### "Comment redater un événement ?"
→ Supprimer et recréer (v2.1 aura drag-drop)

---

## 📞 Besoin d'aide ?

- **Docs complètes** → `RETROPLANNING_README.md`
- **Guide référence** → `RETROPLANNING_QUICK_REFERENCE.txt`
- **Support** → RétroSupport (`/dashboard/support`)

---

**C'est prêt ! 🎉 Créez votre premier événement maintenant !**

_RétroPlanning v2.0 | Novembre 2025_
