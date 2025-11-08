# 🗺️ GUIDE DE NAVIGATION - Système de Modèles de Documents

## 🎯 Accès Rapides

### Depuis le Dashboard

1. **Gestion du Site**
   - Menu: ⚙️ Administration
   - Lien: Gestion du Site / Site Management
   - Onglet: 📋 Modèles de Documents
   
2. **Créer un Modèle**
   - URL: `/admin/site-management` 
   - Tab: Modèles de Documents
   - Bouton: "+ Nouveau Template"

3. **Documentation**
   - Guide Utilisateur: [DOCUMENT_TEMPLATES_USER_GUIDE.md](./DOCUMENT_TEMPLATES_USER_GUIDE.md)
   - Index: [DOCUMENTATION_INDEX_TEMPLATES.md](./DOCUMENTATION_INDEX_TEMPLATES.md)

---

## 🌳 Structure des Pages

```
Dashboard (/)
├── Administration ⚙️
│   └── Gestion du Site 🌐
│       └── SiteManagement
│           ├── 📝 Changelog & Versions
│           ├── 🔐 Accès aux Sites
│           ├── ⚙️ Configuration
│           ├── 📋 Modèles de Documents ← ICI
│           │   └── TemplateManagement
│           │       ├── Liste templates
│           │       ├── Créer (+)
│           │       ├── Modifier (✏️)
│           │       ├── Aperçu (👁️)
│           │       └── Supprimer (🗑️)
│           └── 🛡️ Permissions
│
├── Finance 💰 [Futur]
│   └── Devis & Factures
│       └── [Intégration templates]
│
└── Support
    └── Documentation
        └── Modèles de Documents
```

---

## 🎨 Interface SiteManagement

### Onglet "📋 Modèles de Documents"

```
┌─────────────────────────────────────────────────────┐
│ 📋 Gestion des Modèles de Documents                │
├─────────────────────────────────────────────────────┤
│ Description : Créez et gérez les templates HTML    │
│ pour vos devis et factures...                      │
│                                                     │
│ [+ Nouveau Template] [Actualiser]                  │
├─────────────────────────────────────────────────────┤
│ ┌─────┬────────┬──────┬────────┬──────────────────┐ │
│ │ Nom │ Type   │ Desc │ Défaut │ Actions          │ │
├─────┼────────┼──────┼────────┼──────────────────┤ │
│ │D.St│ QUOTE  │ Std  │ ✓      │ 👁️ ✏️  🗑️        │ │
│ │F.Sp│ INVOICE│ Spon │        │ 👁️ ✏️  🗑️        │ │
│ └─────┴────────┴──────┴────────┴──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Formulaire Création

```
┌──────────────────────────────────────┐
│ Créer un nouveau template             │
├──────────────────────────────────────┤
│                                       │
│ Nom du template *                    │
│ [________________________]            │
│                                       │
│ Description                          │
│ [________________________]            │
│                                       │
│ Type *                               │
│ [QUOTE     ▼] (ou INVOICE)           │
│                                       │
│ Contenu HTML * (WYSIWYG Editor)      │
│ [                                ]   │
│ [    <h1>{{TITRE}}</h1>...      ]   │
│ [                                ]   │
│                                       │
│ CSS personnalisé                     │
│ [                                ]   │
│ [    h1 { color: #2c5aa0; }     ]   │
│ [                                ]   │
│                                       │
│ ☐ Définir comme template par défaut  │
│                                       │
│ Variables disponibles :              │
│ {{NUMERO}}, {{TITRE}}, {{MONTANT}}   │
│ {{DATE}}, ... [+ afficher tous]     │
│                                       │
│  [Annuler]  [Créer]                 │
└──────────────────────────────────────┘
```

---

## 🔄 Flux Complets

### Flux 1: Créer un Template

```
Gestion du Site
    ↓
Onglet "Modèles de Documents"
    ↓
Bouton "+ Nouveau Template"
    ↓
Remplir formulaire
    ├── Nom: "Devis Standard"
    ├── Type: QUOTE
    ├── HTML: "<h1>{{TITRE}}</h1>..."
    └── CSS: "h1 { color: blue; }"
    ↓
[Aperçu] → Valider rendu
    ↓
[Créer] → Template enregistré
    ↓
✅ Template disponible
```

### Flux 2: Modifier un Template

```
Gestion du Site
    ↓
Onglet "Modèles de Documents"
    ↓
Cliquer ✏️ sur un template
    ↓
Modifier champs
    ├── Description
    ├── HTML
    ├── CSS
    └── Défaut: oui/non
    ↓
[Aperçu] → Valider
    ↓
[Mettre à jour]
    ↓
✅ Template mis à jour
```

### Flux 3: Supprimer un Template

```
Gestion du Site
    ↓
Onglet "Modèles de Documents"
    ↓
Cliquer 🗑️ sur un template
    ↓
Si template utilisé:
    └─ ❌ Erreur: "N documents l'utilisent"
    └─ Solution: Supprimer docs d'abord
    
Si template non utilisé:
    ├─ Confirmer suppression
    └─ [Oui]
    ↓
✅ Template supprimé
```

---

## 📱 Responsivité

### Sur Mobile
- ✅ Interface complète accessible
- ✅ Formulaire adapté
- ✅ Tableau scrollable horizontalement
- ⚠️ Éditeur HTML: souris recommandée

### Sur Desktop
- ✅ Optimisé
- ✅ Édition facile
- ✅ Prévisualisation côte à côte
- ✅ Multiples templates ouverts

---

## 🔐 Permissions Requises

### Pour accéder
- ✅ Administrateur SiteManagement
- ✅ Rôle: ADMIN ou MANAGER

### Pour modifier
- ✅ Créateur du template OU ADMIN
- ✅ Historique enregistré (createdBy)

### Pour supprimer
- ✅ ADMIN uniquement
- ✅ Pas si documents associés

---

## 🔍 Recherche et Filtres

### Filtrage par Type

```
Affichage par défaut: TOUS

Cliquer sur Type:
├── [TOUS]       → Tous les templates
├── [QUOTE]      → Seulement Devis
└── [INVOICE]    → Seulement Factures
```

### Recherche par Nom

```
Champ recherche (futur):
[Rechercher...]
├─ "Devis" → Affiche templates contenant "Devis"
├─ "RBE" → Cherche "RBE"
└─ (en temps réel)
```

---

## 💾 Sauvegarde et Restauration

### Sauvegarde Automatique
- ✅ Base de données PostgreSQL Railway
- ✅ Timestamp automatique (createdAt)
- ✅ Versionning Git (backups locaux)

### Restauration
- 🔧 En cas d'erreur: Contactez l'admin
- 🔧 Backups disponibles: `interne/api/backups/`
- 🔧 Migration complète en base: `20251108140108_add_document_templates`

---

## 📊 Statistiques et Monitoring

### Informations Disponibles

```
Par Template:
├── Nom unique
├── Date création
├── Auteur (createdBy)
├── Nombre de documents l'utilisant
├── Défaut: oui/non
└── Type: QUOTE/INVOICE

Globales:
├── Total templates
├── Templates par type
├── Templates par défaut
└── Dernière modification
```

---

## ⚡ Raccourcis Clavier

### Dans les formulaires
- `Tab` : Aller au champ suivant
- `Shift+Tab` : Champ précédent
- `Ctrl+S` : Enregistrer (futur)
- `Esc` : Fermer modal

### Dans l'éditeur HTML
- `Ctrl+A` : Sélectionner tout
- `Ctrl+C/V` : Copier/Coller
- `Ctrl+Z/Y` : Undo/Redo

---

## 🆘 Dépannage Rapide

### Le template ne s'affiche pas
```
Vérifier:
1. ✓ Rafraîchir la page (F5)
2. ✓ Vérifier le Type (QUOTE vs INVOICE)
3. ✓ Vérifier permissions (Admin?)
4. ✓ Regarder console (Ctrl+Shift+I)
```

### L'aperçu ne marche pas
```
Vérifier:
1. ✓ Syntaxe HTML valide
2. ✓ Variables avec {{ }}
3. ✓ Connexion réseau active
4. ✓ API accessible
```

### Impossible de supprimer
```
Le template est utilisé par des documents!
Solution:
1. Aller dans AdminFinance
2. Trouver documents avec ce template
3. Les assigner à un autre template
4. Essayer de supprimer à nouveau
```

---

## 📞 Besoin d'Aide?

| Situation | Solution |
|-----------|----------|
| Première utilisation | Lire USER_GUIDE.md |
| Problème technique | Vérifier console + contactez admin |
| Question API | Voir API README.md |
| Template ne marche pas | Section Dépannage dans USER_GUIDE |

---

**Dernière mise à jour:** 8 novembre 2025

Consultation facile! 🚀
