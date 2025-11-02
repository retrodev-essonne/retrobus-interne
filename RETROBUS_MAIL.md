# 📧 RétroBus Mail - Intégration dans Interne

## Vue d'ensemble

RétroBus Mail est un système de notifications internes intégré à l'application `interne`. Il permet aux utilisateurs de recevoir et consulter des messages directement depuis le tableau de bord.

## Architecture

### Frontend
- **Composant:** `src/components/NotificationCenter.jsx`
- **Styles:** `src/components/NotificationCenter.css`
- **Intégration:** Ajouté dans le Header (barre de navigation supérieure)

### Backend
- **API:** Endpoints disponibles dans `interne/api/src/routes/notifications.js`
- **Service:** `interne/api/src/services/notificationService.js`
- **Base de données:** Tables `InternalMessage` et `NotificationPreference` (Prisma)

## Fonctionnalités

✅ **Réception de messages** - Les utilisateurs reçoivent des notifications
✅ **Badge de décompte** - Affiche le nombre de messages non lus
✅ **Popup de consultation** - Voir/lire/supprimer les messages
✅ **Préférences** - Configurer les notifications par utilisateur
✅ **Archivage** - Garder l'historique des messages

## Structure du dossier

```
interne/
├── src/
│   ├── components/
│   │   ├── NotificationCenter.jsx      # 🔔 Composant principal
│   │   ├── NotificationCenter.css      # Styles
│   │   └── Header.jsx                  # Intégration dans Header
│   └── ...
├── api/
│   ├── src/
│   │   ├── routes/
│   │   │   └── notifications.js        # API endpoints
│   │   ├── services/
│   │   │   └── notificationService.js  # Logique métier
│   │   └── index.js
│   └── ...
└── ...
```

## API Endpoints

### Récupérer les notifications
```bash
GET /api/notifications/inbox?limit=20
Headers: { Authorization: Bearer TOKEN }
```

Réponse:
```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "title": "Nouvelle annonce",
      "body": "...",
      "read": false,
      "createdAt": "2025-11-02T10:00:00Z"
    }
  ],
  "unread": 3
}
```

### Marquer comme lu
```bash
PUT /api/notifications/1/read
Headers: { Authorization: Bearer TOKEN }
```

### Supprimer une notification
```bash
DELETE /api/notifications/1
Headers: { Authorization: Bearer TOKEN }
```

### Récupérer les préférences
```bash
GET /api/notifications/preferences
Headers: { Authorization: Bearer TOKEN }
```

### Mettre à jour les préférences
```bash
PUT /api/notifications/preferences
Headers: { Authorization: Bearer TOKEN }
Body: { enableEmail: true, enablePush: false }
```

## Déploiement

RétroBus Mail est entièrement intégré dans `interne`. Aucune configuration supplémentaire n'est nécessaire au-delà des migrations Prisma:

```bash
# Appliquer les migrations
npx prisma migrate deploy

# Ou en développement:
npx prisma migrate dev --name add_notifications
```

## Utilisation

### Pour les administrateurs

Envoyer une notification à un utilisateur:

```javascript
import { notificationService } from './services/notificationService.js'

await notificationService.createNotification({
  userId: 123,
  title: 'Titre du message',
  body: 'Contenu du message',
  type: 'INFO' // ou 'ALERT', 'SUCCESS'
})
```

### Pour les utilisateurs

Les notifications s'affichent automatiquement dans le header à côté de l'icône de cloche 🔔.

Cliquer sur l'icône pour:
- Voir tous les messages
- Marquer comme lu
- Supprimer
- Configurer les préférences

## Configuration

Les variables d'environnement suivantes peuvent être définies:

```env
# Backend
NOTIFICATION_POLLING_INTERVAL=30000    # Intervalle de polling (ms)
NOTIFICATION_MAX_HISTORY=100           # Nombre max de messages conservés
```

## Tests

### Test en développement

1. Démarrer l'API: `npm run dev` dans `interne/api`
2. Démarrer le frontend: `npm run dev` dans `interne`
3. Envoyer une notification via l'API:

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "userId": 1,
    "title": "Test",
    "body": "Message de test"
  }'
```

4. Le badge devrait s'actualiser dans le header

## Performance

- **Polling interval:** 30 secondes (configurable)
- **Limite d'affichage:** 20 derniers messages
- **Cache:** Stockage localStorage pour les IDs lus

## Sécurité

✅ **Authentification JWT** - Requiert un token valide
✅ **Autorisation** - Seuls les propres messages de l'utilisateur sont visibles
✅ **Validation** - Tous les inputs sont validés côté serveur
✅ **HTTPS** - Communications chiffrées en production

## Dépannage

### Les notifications ne s'affichent pas

1. Vérifier que le token est valide: `localStorage.getItem('token')`
2. Vérifier les logs du backend: `GET /api/notifications/inbox` renvoie 200
3. Vérifier que la base de données est migrée: `npx prisma db push`

### Badge n'affiche pas le bon nombre

1. Vérifier la table `InternalMessage` dans la DB
2. Vérifier que `read=false` pour les messages non lus
3. Rafraîchir la page (F5)

### Erreur "Unauthorized"

1. Vérifier que JWT_SECRET est identique au frontend et backend
2. Vérifier que le token n'a pas expiré
3. Vérifier l'en-tête `Authorization: Bearer TOKEN`

## Prochaines améliorations

- [ ] Notifications push navigateur
- [ ] Sons et animations
- [ ] Categories et tags
- [ ] Search et filtres
- [ ] Export des messages
- [ ] Archivage automatique

## Support

Pour des questions ou bugs, contactez l'équipe de développement RétroBus.
