# 📅 RétroPlanning - Documentation Complète

**Date**: 3 novembre 2025  
**Status**: ✅ Implémentation initiale complétée  
**Version**: 1.0.0

---

## 📋 Vue d'ensemble

**RétroPlanning** est un module de planification centralisé pour RétroBus Essonne qui permet de :
- 📆 Visualiser les événements sur un calendrier interactif
- 📧 Gérer les **dates de campagnes newsletter**
- 🚌 Planifier les **tournées et trajets**
- 🔧 Suivre la **maintenance préventive** des véhicules
- 👥 Organiser les **événements associatifs**
- 📦 Tracker les **livraisons**
- 💰 Gérer les **dates de cotisations**
- **Affecter des bus et chauffeurs** à chaque événement

---

## 🎯 Fonctionnalités principales

### 1. Calendrier interactif multi-vues
- **Vue Mois** : Grille complète avec tous les événements
- **Vue Semaine** : Détail par jour (en développement)
- **Vue Liste** : Tableau récapitulatif tous les événements

### 2. Gestion des événements
Créer et organiser 6 types d'événements colorisés :
- 📧 **Campagnes** (violet) - Newsletter et communications
- 🚌 **Tournées** (orange) - Trajets programmés
- 🔧 **Maintenance** (rouge) - Révisions véhicules
- 👥 **Événements** (vert) - Activités associatives
- 📦 **Livraisons** (bleu) - Réceptions de matériel
- 💰 **Cotisations** (jaune) - Dates de paiements

### 3. Affectations Bus & Chauffeur
Pour chaque événement (surtout tournées) :
- **Véhicule assigné** (immatriculation, marque, modèle)
- **Chauffeur assigné** (nom, matricule)
- **Notes** (conditions spéciales, itinéraires)

### 4. Filtres & Recherche
- Filtrer par type d'événement
- Filtrer par véhicule
- Filtrer par chauffeur
- Recherche par titre/description

---

## 📁 Fichiers créés/modifiés

### Frontend
```
interne/src/pages/
├── RetroPlanning.jsx          [NEW] Composant principal (650+ lignes)
└── MyRBE.jsx                  [MODIFIED] Ajout card RétroPlanning
interne/src/App.jsx            [MODIFIED] Import + route /dashboard/retroplanning
```

### Backend
```
interne/api/src/
├── routes/planning.js         [NEW] Endpoints API (~150 lignes)
└── server.js                  [MODIFIED] Intégration du routeur
```

### Documentation
```
RETROPLANNING_README.md        [NEW] Ce fichier
```

---

## 🔌 Endpoints API

### Planning Events

#### `GET /api/planning/events`
Récupère tous les événements du planning

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "id": "evt-1",
    "title": "Tournée février",
    "type": "TOURNEE",
    "description": "Tournée de collecte",
    "date": "2025-02-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "17:00"
  }
]
```

---

#### `POST /api/planning/events`
Crée un nouvel événement

**Headers**: `Authorization: Bearer <token>, Content-Type: application/json`

**Body**:
```json
{
  "title": "Campagne mars",
  "type": "CAMPAIGN",
  "description": "Newsletter spéciale partenaires",
  "date": "2025-03-01T00:00:00Z",
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Response** (201):
```json
{
  "id": "evt-1234567890",
  "title": "Campagne mars",
  "type": "CAMPAIGN",
  "description": "Newsletter spéciale partenaires",
  "date": "2025-03-01T00:00:00Z",
  "startTime": "09:00",
  "endTime": "17:00",
  "createdAt": "2025-11-03T10:30:00Z"
}
```

---

#### `DELETE /api/planning/events/:eventId`
Supprime un événement

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Event deleted"
}
```

---

### Planning Assignments (Bus & Chauffeur)

#### `GET /api/planning/assignments`
Récupère toutes les affectations

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "id": "asg-1",
    "eventId": "evt-1",
    "vehicleId": "veh-1",
    "driverId": "drv-1",
    "notes": "Parcours habituel",
    "createdAt": "2025-11-03T10:30:00Z"
  }
]
```

---

#### `POST /api/planning/assignments`
Crée une affectation bus/chauffeur

**Headers**: `Authorization: Bearer <token>, Content-Type: application/json`

**Body**:
```json
{
  "eventId": "evt-1",
  "vehicleId": "veh-1",
  "driverId": "drv-1",
  "notes": "Trajet spécial, départ à 6h"
}
```

**Response** (201):
```json
{
  "id": "asg-1234567890",
  "eventId": "evt-1",
  "vehicleId": "veh-1",
  "driverId": "drv-1",
  "notes": "Trajet spécial, départ à 6h",
  "createdAt": "2025-11-03T10:30:00Z"
}
```

---

#### `DELETE /api/planning/assignments/:assignmentId`
Supprime une affectation

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Assignment deleted"
}
```

---

## 🚀 Utilisation

### Accéder au RétroPlanning
1. Connectez-vous à l'intranet
2. Allez dans **MyRBE**
3. Cliquez sur la carte **RétroPlanning** 🟠

Ou directement : `/dashboard/retroplanning`

### Créer un événement
1. Cliquez sur **"Nouvel événement"** (bouton bleu)
2. Remplissez le formulaire :
   - Titre (requis)
   - Type (requis)
   - Date (requis)
   - Heure début/fin (optionnel)
   - Description (optionnel)
3. Cliquez **"Créer"**

### Affecter un bus & chauffeur
1. Cliquez sur **"Affecter bus/chauffeur"** (bouton vert)
2. Sélectionnez :
   - Événement (requis)
   - Véhicule (requis)
   - Chauffeur (requis)
   - Notes (optionnel)
3. Cliquez **"Affecter"**

### Visualiser les détails
1. Cliquez sur un événement dans le calendrier
2. Ou cliquez sur l'icône 👁️ dans la liste
3. Voir :
   - Type + titre
   - Date & horaires
   - Véhicule assigné
   - Chauffeur assigné
   - Notes d'affectation

### Filtrer
Utilisez les filtres en haut :
- **Recherche** : par titre/description
- **Type** : par catégorie d'événement
- **Véhicule** : par bus
- **Chauffeur** : par conducteur

---

## 🔄 Intégrations prévues

### Sync avec NewsletterCampaigns
Les campagnes créées dans **Gestion Newsletter** s'affichent automatiquement dans RétroPlanning avec type **CAMPAIGN**.

### Sync avec EventsManagement
Les événements créés dans **Gestion des Événements** apparaissent avec type **EVENEMENT**.

### Sync avec RetroBus (Maintenance)
Les tâches de maintenance du **Dashboard RétroBus** s'affichent avec type **MAINTENANCE**.

### Sync avec Members (Cotisations)
Les dates de paiement des membres s'affichent avec type **COTISATION**.

---

## 🗄️ Structure de données (à implémenter en BD)

### Planning_Events
```prisma
model PlanningEvent {
  id           String   @id @default(cuid())
  title        String
  type         String   // CAMPAIGN, TOURNEE, MAINTENANCE, EVENEMENT, LIVRAISON, COTISATION
  description  String?
  date         DateTime
  startTime    String?  // HH:mm
  endTime      String?  // HH:mm
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  assignments  PlanningAssignment[]
}

model PlanningAssignment {
  id           String   @id @default(cuid())
  eventId      String
  event        PlanningEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  vehicleId    String
  driverId     String
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([eventId])
  @@index([vehicleId])
  @@index([driverId])
}
```

---

## 🛠️ Prochaines étapes

### Court terme (Phase 1 - Semaine 1)
- [ ] Connecter endpoints à Prisma/BD
- [ ] Tester création/suppression d'événements
- [ ] Tester affectations bus/chauffeur
- [ ] Intégrer vrai(s) endpoints véhicules et chauffeurs

### Moyen terme (Phase 2 - Semaine 2)
- [ ] Vue semaine (détail par jour/heure)
- [ ] Export calendrier (iCal, PDF, Excel)
- [ ] Notifications de rappel
- [ ] Historique des modifications
- [ ] Dupliquer événement (copier d'une année à l'autre)

### Long terme (Phase 3+)
- [ ] Drag-and-drop pour redater
- [ ] Sync avec Google Calendar / Outlook
- [ ] SMS de rappel (chauffeurs)
- [ ] Rapports statistiques
- [ ] API publique iCal/ics
- [ ] Temps réel (WebSocket) pour multi-users

---

## 📊 Types d'événements détaillés

| Type | Couleur | Icône | Cas d'usage |
|------|---------|-------|-----------|
| **CAMPAIGN** | Violet 🟣 | 📧 | Dates de newsletter, envoi campagnes |
| **TOURNEE** | Orange 🟠 | 🚌 | Trajets, collectes, distribution |
| **MAINTENANCE** | Rouge 🔴 | 🔧 | Révisions, contrôles techniques |
| **EVENEMENT** | Vert 🟢 | 👥 | Événements assoc., formations |
| **LIVRAISON** | Bleu 🔵 | 📦 | Arrivées matériel, stocks |
| **COTISATION** | Jaune 🟡 | 💰 | Dates d'échéance, rappels |

---

## 🎨 Architecture UI

```
RétroPlanning
├── Header (titre + boutons)
│   ├── Nouvel événement
│   └── Affecter bus/chauffeur
├── Filters (recherche, type, véhicule, chauffeur)
├── Tabs (Mois, Semaine, Liste)
│   ├── Tab Mois
│   │   ├── Header (navigation mois)
│   │   └── Grille 7×6 (jours + événements)
│   ├── Tab Semaine
│   │   └── [En développement]
│   └── Tab Liste
│       └── Cards d'événements (avec affectations)
└── Modals
    ├── Créer événement
    ├── Affecter bus/chauffeur
    └── Détails événement
```

---

## 🔐 Sécurité

- ✅ Authentification JWT requise
- ✅ Token Bearer sur tous les endpoints
- ✅ Validation des champs
- ✅ Protection CORS active
- ✅ Limite upload (N/A pour planning)

---

## 📞 Support & Questions

Pour les questions/bugs :
1. Vérifiez les **console.logs** en dev
2. Testez les endpoints avec **Postman/cURL**
3. Vérifiez que le token est valide
4. Vérifiez CORS_ORIGINS env var

---

**Créé avec ❤️ par GitHub Copilot**  
**Pour RétroBus Essonne | Interne | 2025**
