# ⚡ QUICK START - Modèles de Documents

## 🚀 En 5 Minutes

### 1️⃣ Accéder
```
Administration ⚙️ → Gestion du Site → Modèles de Documents
```

### 2️⃣ Créer
```
Cliquer: [+ Nouveau Template]
Remplir:
  Nom: "Devis RBE"
  Type: QUOTE
  HTML: <h1>{{TITRE}}</h1><p>Montant: {{MONTANT}}€</p>
  
Cliquer: [Créer]
✅ Template créé!
```

### 3️⃣ Utiliser
```
Futur: AdminFinance → Nouveau Devis
  → Sélectionner template "Devis RBE"
  → Générer HTML automatiquement
```

---

## 📋 Variables Disponibles

```
{{NUMERO}}         → N° devis/facture (ex: DEV-2025-001)
{{TITRE}}          → Titre document (ex: Devis Transport)
{{MONTANT}}        → Montant HT
{{DATE}}           → Date aujourd'hui
{{DESCRIPTION}}    → Description long texte
{{TOTAL}}          → Total TTC
{{DUE_DATE}}       → Date limite paiement
{{STATUS}}         → État (DRAFT/SENT/PAID)
{{PAYMENT_METHOD}} → Mode paiement
{{NOTES}}          → Notes additionnelles
```

---

## 🎨 Exemple HTML Simple

```html
<div style="font-family: Arial">
  <h1>{{TITRE}}</h1>
  <p>Devis N° <strong>{{NUMERO}}</strong></p>
  <p>Du <strong>{{DATE}}</strong></p>
  
  <hr>
  
  <h2>Montant</h2>
  <p>HT: {{MONTANT}}€</p>
  <p>Total: {{TOTAL}}€</p>
  
  <hr>
  
  <p>{{DESCRIPTION}}</p>
  
  <footer>
    <small>Date limite: {{DUE_DATE}}</small>
  </footer>
</div>
```

---

## 🎨 Exemple avec CSS

**HTML:**
```html
<div class="devis">
  <header class="header">
    <h1>{{TITRE}}</h1>
  </header>
  
  <section class="montants">
    <div class="montant-ht">
      <span>Montant HT:</span>
      <strong>{{MONTANT}}€</strong>
    </div>
    <div class="montant-total">
      <span>Total TTC:</span>
      <strong>{{TOTAL}}€</strong>
    </div>
  </section>
</div>
```

**CSS:**
```css
.devis {
  max-width: 800px;
  margin: 20px auto;
  border: 1px solid #ddd;
  padding: 20px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 28px;
}

.montants {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.montant-ht, .montant-total {
  padding: 15px;
  background: #f5f5f5;
  border-radius: 5px;
  flex: 1;
  margin-right: 10px;
}

.montant-total {
  background: #e8f5e9;
  font-weight: bold;
  font-size: 16px;
}

.montant-total strong {
  color: #2e7d32;
  font-size: 20px;
}
```

---

## ✅ Checklist Création

- [ ] ✏️ Remplir le nom
- [ ] 📋 Choisir le type (QUOTE/INVOICE)
- [ ] 🏷️ Ajouter une description
- [ ] 💻 Remplir HTML (valide)
- [ ] 🎨 (Optionnel) Ajouter CSS personnalisé
- [ ] 👁️ Cliquer [Aperçu] pour valider
- [ ] ✓ Définir comme défaut (optionnel)
- [ ] ✅ Cliquer [Créer]

---

## 🔍 Vérifier Syntaxe

**Variables bien formées:**
```html
✅ {{NUMERO}}
✅ {{MONTANT}}
✅ {{DATE}}

❌ {NUMERO}       (une seule accolade)
❌ {{ NUMERO }}   (espaces)
❌ {{numero}}     (minuscules)
```

**HTML valide:**
```html
✅ <p>Texte</p>
✅ <div class="box">Contenu</div>
✅ <br> ou <br/>

❌ <p>Texte         (pas fermé)
❌ <<p>>           (doubles crochets)
❌ <p class=>      (attribut vide)
```

---

## 📸 Actions Principales

| Action | Bouton | Raccourci |
|--------|--------|-----------|
| Créer | + Nouveau Template | - |
| Voir Liste | Actualiser | F5 |
| Modifier | ✏️ Edit | - |
| Aperçu | 👁️ Preview | - |
| Supprimer | 🗑️ Delete | - |
| Par défaut | ✓ Default | - |

---

## 🆘 Aide Rapide

**Template ne s'affiche pas?**
→ Rafraîchir (F5) + Vérifier Type

**Erreur dans HTML?**
→ Valider balises + Variables avec {{ }}

**Impossible supprimer?**
→ Template utilisé par des documents

**Besoin de plus?**
→ Consulter DOCUMENTATION_INDEX_TEMPLATES.md

---

**💡 Astuce:** Commencez simple, puis ajoutez CSS au fur et à mesure!

**Version:** 1.0 | Date: 8 nov 2025
