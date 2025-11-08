# Gestion des Modèles de Documents - Guide Utilisateur

## Accès à la Gestion des Modèles

1. Connectez-vous à **Gestion du Site** (Site Management)
2. Allez dans l'onglet **"📋 Modèles de Documents"**

## Interface Principale

### Liste des Templates
- **Affichage en tableau** avec :
  - Nom du modèle
  - Type (Devis ou Facture)
  - Description
  - Badge "Défaut" si c'est le modèle par défaut
  - Actions (Aperçu, Modifier, Supprimer)

### Boutons d'Action
- **+ Nouveau Template** : Créer un nouveau modèle
- **Aperçu** (👁️) : Voir le rendu HTML avec données de test
- **Modifier** (✏️) : Éditer le modèle
- **Supprimer** (🗑️) : Supprimer le modèle (si non utilisé)

## Créer un Nouveau Modèle

1. Cliquez sur **"+ Nouveau Template"**
2. Remplissez les informations :

### Champs du Formulaire

| Champ | Description | Requis |
|-------|-------------|--------|
| **Nom** | Identifiant unique du modèle | ✓ |
| **Description** | Description courte (optionnel) | - |
| **Type** | QUOTE (Devis) ou INVOICE (Facture) | ✓ |
| **Contenu HTML** | Code HTML avec {{VARIABLES}} | ✓ |
| **CSS personnalisé** | Styles CSS optionnels | - |
| **Définir comme défaut** | Case à cocher | - |

### Exemple de Contenu HTML

```html
<div style="font-family: Arial; padding: 20px; border: 1px solid #ddd;">
  <h1>{{TITRE}}</h1>
  
  <div style="margin-top: 20px;">
    <p><strong>Numéro :</strong> {{NUMERO}}</p>
    <p><strong>Date :</strong> {{DATE}}</p>
  </div>
  
  <hr>
  
  <div style="margin: 20px 0;">
    <h3>Détails</h3>
    <p>{{DESCRIPTION}}</p>
  </div>
  
  <div style="margin-top: 30px; padding: 15px; background-color: #f0f0f0; border-radius: 5px;">
    <h2 style="color: #2c5aa0; margin: 0;">Montant : {{MONTANT}} €</h2>
    <p style="margin: 10px 0; color: #666;">Total : {{TOTAL}} €</p>
  </div>
  
  <div style="margin-top: 20px; font-size: 12px; color: #999;">
    <p>Notes : {{NOTES}}</p>
  </div>
</div>
```

## Variables Disponibles

Utilisez la syntaxe `{{VARIABLE}}` pour insérer des données automatiquement :

| Variable | Contenu | Exemple |
|----------|---------|---------|
| `{{NUMERO}}` | Numéro du document | DV-2025-001 |
| `{{TITRE}}` | Titre du document | Devis de transport |
| `{{MONTANT}}` | Montant facturé | 1500.00 |
| `{{DATE}}` | Date du document | 08/11/2025 |
| `{{DESCRIPTION}}` | Description détaillée | Service de transport RétroBus |
| `{{TOTAL}}` | Montant total | 1500.00 |
| `{{DUE_DATE}}` | Date d'échéance | 22/11/2025 |
| `{{STATUS}}` | Statut du document | SENT, ACCEPTED, etc. |
| `{{PAYMENT_METHOD}}` | Mode de paiement | Virement, Espèces, Carte |
| `{{NOTES}}` | Notes/Remarques | Modalités de paiement... |

**Important :** Les variables sont **sensibles à la casse** pour le contenu, mais **insensibles à la casse** pour la clé.

Exemples valides :
- `{{MONTANT}}`
- `{{ MONTANT }}`
- `{{montant}}`

## Aperçu d'un Modèle

1. Cliquez sur le bouton **Aperçu** (👁️)
2. Voir le rendu HTML avec des données de test
3. Les variables sont remplacées par des valeurs d'exemple
4. Validez le rendu avant de l'utiliser

## Modifier un Modèle

1. Cliquez sur le bouton **Modifier** (✏️)
2. Éditez les champs souhaités
3. Cliquez sur **"Mettre à jour"**

### Restrictions sur la Modification
- **Impossible de changer le type** d'un modèle ayant des documents associés
- **Impossible de supprimer** un modèle utilisé par des documents

## Supprimer un Modèle

1. Cliquez sur le bouton **Supprimer** (🗑️)
2. Confirmez la suppression
3. Le modèle est supprimé définitivement

### Contraintes de Suppression
- ❌ **Impossible** si des documents utilisent ce modèle
- ✅ **Possible** uniquement si aucun document n'y est lié

## Définir un Modèle par Défaut

Lors de la création ou la modification d'un modèle :

1. Cochez la case **"Définir comme template par défaut"**
2. Choisissez le type (Devis ou Facture)
3. Enregistrez

**Note :** Un seul modèle par défaut par type. Le précédent sera automatiquement désélectionné.

## Utilisation dans les Devis & Factures

Une fois les modèles créés, ils seront disponibles lors de la création/édition de devis et factures :

1. Dans l'onglet **"📄 Devis & Factures"** d'AdminFinance
2. Sélectionnez un modèle lors de la création
3. Le HTML sera automatiquement généré avec vos données

## Conseils de Création

### Pour un Bon Template

✓ Utilisez du HTML simple et structuré
✓ Testez toutes les variables avec Aperçu
✓ Validez le CSS avec un navigateur
✓ Laissez de l'espace pour les données longues
✓ Utilisez des fonts standards (Arial, Georgia, etc.)

### À Éviter

✗ JavaScript (non exécuté dans les PDF)
✗ Ressources externes non CORS
✗ Images volumineuses
✗ Couleurs trop vives
✗ Mise en page rigide (responsive meilleur)

## Dépannage

### Le modèle n'apparaît pas ?
- Vérifiez le **Type** (QUOTE vs INVOICE)
- Actualisez la page
- Vérifiez les permissions

### Les variables ne se remplacent pas ?
- Vérifiez la **casse** : `{{MONTANT}}` pas `{{montant}}`
- Assurez-vous d'avoir des données dans le champ
- Testez avec Aperçu

### Impossible de supprimer ?
- Vérifiez que **aucun document** n'utilise ce modèle
- Sinon, supprimez d'abord les documents associés

## Support

Pour des questions ou des problèmes :
- Consultez la [Documentation API](../api/README_DOCUMENT_TEMPLATES.md)
- Contactez l'administrateur technique
