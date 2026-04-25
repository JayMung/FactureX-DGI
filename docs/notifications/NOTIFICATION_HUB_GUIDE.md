# 🔔 Notification Hub — Guide Complet

> Version : 1.0 | Statut : ✅ Production | Mise à jour : Avril 2026

## Vue d'ensemble

Le Notification Hub est un système de notifications **temps réel** basé sur le **Service Worker** (Web Push API) avec une UI React intégrée. Il permet d'informer les utilisateurs des événements importants de l'application.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Application                         │
│  ┌──────────────────────┐    ┌──────────────────────┐ │
│  │   NotificationCenter  │    │ NotificationSettings │ │
│  │   (UI - React)        │    │ (Préférences)        │ │
│  └──────────┬───────────┘    └──────────┬───────────┘ │
│             │                            │            │
│  ┌──────────┴────────────────────────────┴───────────┐│
│  │              notificationService.ts                ││
│  │  CRUD / marquage lu / historique                   ││
│  └──────────────────────┬─────────────────────────────┘│
└─────────────────────────┼─────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────┐
│ notificationSender.ts   │                              │
│ (Push via Web Push API) │                              │
└─────────────────────────┘                              │
                   │                                      │
┌──────────────────┴─────────────────────────────────────┐│
│              Service Worker (public/sw.js)               │
│  - Reçoit les push events                               │
│  - Affiche les notifications système                    │
│  - Gère le cache offline                                │
└─────────────────────────────────────────────────────────┘
```

---

## Utilisation

### Afficher le centre de notifications

```tsx
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

function Header() {
  return (
    <header>
      <NotificationCenter />
    </header>
  );
}
```

### Hook useNotifications

```tsx
import { useNotifications } from "@/hooks/useNotifications";

function MyComponent() {
  const {
    notifications,       // Liste des notifications
    unreadCount,         // Nombre non lues
    markAsRead,          // (id) => void
    markAllAsRead,       // () => void
    deleteNotification,  // (id) => void
    isLoading,           // boolean
  } = useNotifications();

  return (
    <div>
      <p>Notifications non lues : {unreadCount}</p>
      {/* ... */}
    </div>
  );
}
```

### Envoyer une notification (côté serveur)

```typescript
import { notificationService } from "@/services/notificationService";

await notificationService.create({
  userId: "uuid-user",
  title: "Nouvelle facture",
  message: "La facture FAC-2026-0012 a été créée",
  type: "facture",
  link: "/factures/123",
});
```

### Envoyer une notification push (Service Worker)

```typescript
import { notificationSender } from "@/services/notificationSender";

await notificationSender.push({
  userId: "uuid-user",
  title: "Paiement reçu",
  body: "50 000 FC reçus de Client XYZ",
});
```

---

## Types de notifications

| Type | Icône | Description |
|------|-------|-------------|
| `facture` | 📄 | Création, modification, paiement de facture |
| `devis` | 📋 | Création, acceptation, refus de devis |
| `paiement` | 💰 | Paiement reçu, échec de paiement |
| `client` | 👤 | Nouveau client, mise à jour |
| `colis` | 📦 | Changement statut colis |
| `transaction` | 🔄 | Nouvelle transaction |
| `dgi` | 🇨🇩 | Statut DGI, validation, rejet |
| `system` | ⚙️ | Alertes système, maintenance |
| `permission` | 🔐 | Changement de permissions |
| `security` | 🛡️ | Alerte de sécurité |

---

## Configuration des préférences

Les utilisateurs peuvent configurer leurs préférences par type de notification :

```tsx
import { NotificationSettingsTab } from "@/components/notifications/NotificationSettingsTab";

function Settings() {
  return <NotificationSettingsTab />;
}
```

Options disponibles par type :
- ✅ **Push** — Notification push via Service Worker
- ✅ **In-app** — Notification dans le centre de notifications
- ❌ **Désactivé** — Aucune notification

---

## Base de données

### Table push_subscriptions

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

### Table notifications

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('facture','devis','paiement','client','colis','transaction','dgi','system','permission','security')),
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Index

```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

---

## Service Worker (PWA)

Le fichier `public/sw.js` gère :
- **Notifications push** — Affichage des notifications système
- **Cache offline** — Mise en cache des assets statiques
- **Mise à jour** — Cycle de mise à jour du Service Worker

### Installation

Le Service Worker est enregistré automatiquement au démarrage de l'application.

### Support navigateur

- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Safari 16.4+ (macOS)
- ✅ Opera 37+
- ⚠️ Safari iOS — Support limité

---

## Bonnes pratiques

1. **Ne pas spammer** — Limiter les notifications à 1 par événement
2. **Regrouper** — Les notifications du même type peuvent être groupées
3. **Liens utiles** — Toujours ajouter un `link` pointant vers la ressource concernée
4. **Marquage lu** — Marquer comme lu automatiquement après clic
5. **Rétention** — Nettoyer les notifications de plus de 90 jours

---

## API Edge Functions

### Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/notifications` | GET | Liste des notifications (paginated) |
| `/api/notifications` | POST | Créer une notification |
| `/api/notifications/:id/read` | PATCH | Marquer comme lu |
| `/api/notifications/read-all` | POST | Marquer tout comme lu |
| `/api/notifications/:id` | DELETE | Supprimer une notification |
| `/api/push/subscribe` | POST | S'abonner aux push |
| `/api/push/unsubscribe` | POST | Se désabonner |

---

*Document créé en Avril 2026 dans le cadre de la Phase 7 (COD-86)*
