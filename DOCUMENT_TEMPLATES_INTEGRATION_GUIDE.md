# Intégration des Modèles de Documents - Guide Technique

## Vue d'ensemble

Le système de modèles de documents permet de :
- Créer des templates HTML réutilisables pour devis et factures
- Définir des variables qui seront remplacées automatiquement
- Générer des documents HTML/PDF formatés avec vos propres branding
- Gérer une bibliothèque de templates par type de document

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│ SiteManagement.jsx                                       │
│  ├── TemplateManagement.jsx (nouvelle UI)              │
│  │   ├── Liste des templates                           │
│  │   ├── Créer/Éditer/Supprimer                        │
│  │   └── Aperçu avec données de test                   │
│  └── AdminFinance.jsx (futur)                          │
│      ├── Sélecteur de template                         │
│      └── Prévisualisation avant génération             │
└─────────────────────────────────────────────────────────┘
         ↓ (HTTP/REST API)
┌─────────────────────────────────────────────────────────┐
│              Backend (Node.js/Express)                   │
├─────────────────────────────────────────────────────────┤
│ document-templates-api.js                              │
│  ├── POST /api/document-templates (créer)              │
│  ├── GET /api/document-templates (lister)              │
│  ├── PUT /api/document-templates/:id (modifier)        │
│  ├── DELETE /api/document-templates/:id (supprimer)    │
│  ├── POST /api/document-templates/:id/preview (test)   │
│  ├── POST /api/documents/:docId/render (générer)       │
│  └── GET /api/documents/:docId/pdf (PDF - TODO)        │
└─────────────────────────────────────────────────────────┘
         ↓ (Prisma ORM)
┌─────────────────────────────────────────────────────────┐
│            Database (PostgreSQL/Railway)                 │
├─────────────────────────────────────────────────────────┤
│ document_templates (table)                              │
│  ├── id (PRIMARY KEY)                                  │
│  ├── name (UNIQUE)                                     │
│  ├── docType (QUOTE|INVOICE)                           │
│  ├── htmlContent (HTML avec {{VARIABLES}})            │
│  ├── cssContent (CSS optionnel)                        │
│  ├── isDefault (BOOLEAN)                               │
│  └── timestamps                                        │
│                                                         │
│ FinancialDocument (relation)                           │
│  ├── templateId (FOREIGN KEY)                          │
│  └── ... autres champs                                 │
└─────────────────────────────────────────────────────────┘
```

## Flux d'Utilisation

### 1. Créer un Template

**Interface:** SiteManagement → Modèles de Documents → Nouveau

```javascript
// POST /api/document-templates
{
  "name": "Devis Standard RétroBus",
  "description": "Template standard pour tous les devis",
  "docType": "QUOTE",
  "htmlContent": "<h1>{{TITRE}}</h1>...",
  "cssContent": "h1 { color: #2c5aa0; }",
  "isDefault": true,
  "createdBy": "admin-user-id"
}
```

### 2. Aperçu du Template

**Interface:** Cliquer sur l'icône "Aperçu"

```javascript
// POST /api/document-templates/:id/preview
{
  "MONTANT": "2500.00",
  "NOTES": "Test notes"
}
// Response:
{
  "html": "<h1>Devis de test</h1><p>Montant: 2500.00 €</p>...",
  "css": "h1 { color: #2c5aa0; }",
  "variables": ["NUMERO", "TITRE", "MONTANT", ...]
}
```

### 3. Créer un Document avec Template

**Future Interface:** AdminFinance → Devis & Factures → Nouveau

```javascript
// POST /api/financial-documents
{
  "type": "QUOTE",
  "number": "DV-2025-001",
  "title": "Devis de transport",
  "amount": 1500.00,
  "templateId": "cuid-of-template",
  "createdBy": "user-id"
}
```

### 4. Rendre le Document

**Utilisation interne ou pour affichage**

```javascript
// POST /api/documents/:docId/render
// Response:
{
  "html": "<h1>Devis de transport</h1><p>Numéro: DV-2025-001</p>...",
  "css": "h1 { color: #2c5aa0; }",
  "documentNumber": "DV-2025-001",
  "templateName": "Devis Standard RétroBus"
}
```

### 5. Générer PDF (TODO)

```javascript
// GET /api/documents/:docId/pdf
// Requires: puppeteer or similar PDF generator
// Returns: PDF binary data
```

## Cas d'Utilisation

### Cas 1: Créer un template réglementaire

Un administrateur crée un template "Facture Conforme Légalité" avec :
- Logo et adresse de l'association
- Mentions obligatoires (N° SIRET, etc.)
- Champs de TVA (même si 0%)
- Conditions de paiement

### Cas 2: Générer des documents en masse

Depuis AdminFinance, créer plusieurs devis rapidement :
1. Sélectionner le template par défaut
2. Remplir rapidement les montants
3. Les documents s'affichent immédiatement avec le bon format

### Cas 3: Branding par client

Créer différents templates :
- Template "RétroBus Standard"
- Template "Sponsor"
- Template "Partenaire"

Et les sélectionner selon le contexte.

## Points Techniquement Importants

### Substitution de Variables

Algorithme de remplacement :

```javascript
function substituteVariables(html, data) {
  let result = html;
  
  // Case-insensitive replacement
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, value || '');
  });
  
  return result;
}

// Exemples valides:
// {{NUMERO}}, {{ NUMERO }}, {{numero}} → tous valides
// {{NUMERO}} avec data.NUMERO = "DV-2025-001" → "DV-2025-001"
```

### Stockage JSON

Les variables sont stockées en JSON dans la base :

```json
{
  "variables": "[\"NUMERO\", \"TITRE\", \"MONTANT\", \"DATE\", \"DESCRIPTION\", \"TOTAL\", \"NOTES\"]"
}
```

### Relations Base de Données

```prisma
model DocumentTemplate {
  id           String   @id @default(cuid())
  ...
  financialDocuments FinancialDocument[]  // One-to-many
}

model FinancialDocument {
  ...
  templateId   String?
  template     DocumentTemplate? @relation(fields: [templateId])
  ...
}
```

Protection lors de la suppression :
- ❌ Impossible de supprimer un template utilisé
- ✅ Cascade: Si on supprime le document, le template reste

## Variables Disponibles (Contexte)

| Variable | Source | Format | Exemple |
|----------|--------|--------|---------|
| `{{NUMERO}}` | `FinancialDocument.number` | String | "DV-2025-001" |
| `{{TITRE}}` | `FinancialDocument.title` | String | "Transport" |
| `{{MONTANT}}` | `FinancialDocument.amount` | Float (2 decimals) | "1500.00" |
| `{{DATE}}` | `FinancialDocument.date` | LocaleString FR | "08/11/2025" |
| `{{DESCRIPTION}}` | `FinancialDocument.description` | String | "..." |
| `{{TOTAL}}` | `FinancialDocument.amount` | Float (2 decimals) | "1500.00" |
| `{{DUE_DATE}}` | `FinancialDocument.dueDate` | LocaleString FR | "22/11/2025" |
| `{{STATUS}}` | Status enum | String | "SENT" |
| `{{PAYMENT_METHOD}}` | `FinancialDocument.paymentMethod` | String | "Virement" |
| `{{NOTES}}` | `FinancialDocument.notes` | String | "..." |

## Erreurs Courantes

### Erreur: "Cannot delete template: 2 document(s) are using it"

**Cause:** Le template est référencé par des documents

**Solution:** 
- Vérifier quels documents l'utilisent
- Les supprimer ou les assigner à un autre template
- Ensuite, supprimer le template

### Erreur: "Template name already exists"

**Cause:** Un template avec ce nom existe déjà

**Solution:**
- Utiliser un autre nom
- Ou modifier l'existant au lieu de créer nouveau

### Variables non remplacées

**Cause:** 
- Mauvaise syntaxe : `{NUMERO}` au lieu de `{{NUMERO}}`
- Casse différente dans les données (non impactant mais vérifier)
- Variable vide dans les données

**Solution:**
- Utiliser `{{ }}` (double accolade)
- Tester avec Aperçu
- Vérifier que la donnée existe dans le document

## Prochaines Évolutions

1. **PDF Generation** 
   - Installer puppeteer
   - Implémenter endpoint GET /api/documents/:docId/pdf
   
2. **Email Integration**
   - Envoyer documents par email en PDF
   - Utiliser templates pour le corps de l'email

3. **Template Versioning**
   - Versionner les templates
   - Tracer l'historique des modifications

4. **Template Categories**
   - Grouper templates par catégories
   - Tags pour meilleure organisation

5. **Custom CSS Library**
   - Ajouter des classes CSS réutilisables
   - Thèmes de couleurs prédéfinis

6. **Multi-langue**
   - Supports pour plusieurs langues
   - Variables dynamiques par langue

## Support et Documentation

- 📖 Guide Utilisateur : `DOCUMENT_TEMPLATES_USER_GUIDE.md`
- 📚 API Reference : `interne/api/README_DOCUMENT_TEMPLATES.md`
- 🧪 Tests : `interne/api/test-document-templates.js`
- 💻 Code : `interne/src/components/TemplateManagement.jsx`
