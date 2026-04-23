# 🔧 Plan de Build Technique — FactureSmart Phase 5
## Build Frontend/Backend Module par Module

**Issue** : COD-25  
**Parent** : COD-22 (Phase 4 - Design Refactoring Complet)  
**Version** : 1.0  
**Date** : 23 Avril 2026  
**Statut** : ✅ Plan complet — Prêt pour implémentation

---

## 📊 Contexte

### État actuel du projet
- **Version** : v1.0.3 (Production Ready)
- **Screens produits** : 52/78 (67%)
- **Screens restants** : 26
- **Stack** : React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase

### Écrans déjà livrés (v1 + v2)
- ✅ Auth (Login, Reset Password)
- ✅ Dashboard principal
- ✅ Module Clients CRUD complet
- ✅ Module Transactions CRUD complet
- ✅ Module Factures/Devis CRUD complet
- ✅ Module Paramètres
- ✅ Rapports fiscaux
- ✅ Transmission DGI
- ✅ 52 modales, états, et écrans secondaires

### Écrans restants à construire (26 écrans)
Répartis en **7 modules fonctionnels** à livrer en **4 phases**.

---

## 🗺️ Scope Remaining — 26 Écrans

### Module A : Onboarding (4 écrans)
| # | Écran | Fichier source | Route React | Complexité |
|---|-------|---------------|-------------|------------|
| A2 | Onboarding slide 2 — Comment créer facture | `screen-A1-onboarding.html` | `/onboarding` | Faible |
| A3 | Onboarding slide 3 — Transmission DGI | `screen-A1-onboarding.html` | `/onboarding` | Faible |
| A4 | Onboarding completion — Félicitations | `screen-A1-onboarding.html` | `/onboarding/complete` | Faible |
| A5 | Setup wizard — Configuration initiale | `screen-A5-setup-wizard.html` | `/setup` | Moyenne |

### Module B : Inscription Multi-étapes (4 écrans)
| # | Écran | Fichier source | Route React | Complexité |
|---|-------|---------------|-------------|------------|
| B2 | Inscription Étape 2 — Raison sociale | `screen-B-inscription.html` | `/register/step-2` | Faible |
| B3 | Inscription Étape 3 — NIF, RCCM, adresse | `screen-B-inscription.html` | `/register/step-3` | Moyenne |
| B4 | Inscription Étape 4 — Vérification NIF API DGI | `screen-B-inscription.html` | `/register/step-4` | Haute |
| B6 | Onboarding wizard post-inscription | `screen-B6-onboarding-post.html` | `/onboarding/post` | Moyenne |

### Module C : Modales Avancées (2 écrans)
| # | Écran | Fichier source | Route/Type | Complexité |
|---|-------|---------------|------------|------------|
| C13 | Modal édition ligne produit | `screen-C13-modal-edit-line.html` | Modal component | Moyenne |
| C14 | Modal génération rapport | `screen-C14-modal-rapport.html` | Modal component | Moyenne |

### Module D : Notifications Push (1 écran)
| # | Écran | Fichier source | Route React | Complexité |
|---|-------|---------------|-------------|------------|
| D4 | Notification push mobile | `screen-D-notifications.html` | Service Worker | Haute |

### Module E : Rôles & Permissions Étendus (2 écrans)
| # | Écran | Fichier source | Route React | Complexité |
|---|-------|---------------|-------------|------------|
| E3 | Détail / Modifier utilisateur | `screen-E-roles.html` | `/users/:id` | Moyenne |
| E6 | Invitation utilisateur par email | `screen-E-roles.html` | `/users/invite` | Moyenne |

### Module F : Paiement Carte (1 écran)
| # | Écran | Fichier source | Route React | Complexité |
|---|-------|---------------|-------------|------------|
| F4 | Paiement par carte bancaire | `screen-F-abonnement.html` | `/subscribe/payment` | Haute |

### Module G : Paramètres POS (1 écran)
| # | Écran | Fichier source | Route React | Complexité |
|---|-------|---------------|-------------|------------|
| G4 | Paramètres POS avancés | `screen-G-pos.html` | `/settings/pos` | Moyenne |

### Module H : Écrans Mobiles (3 écrans)
| # | Écran | Fichier source | Route React | Complexité |
|---|-------|---------------|-------------|------------|
| H4 | Liste factures mobile | `screen-H-mobile.html` | `/m/factures` | Moyenne |
| H6 | Facture détail mobile | `screen-H-mobile.html` | `/m/factures/:id` | Moyenne |
| H7 | Notification mobile | `screen-H-mobile.html` | PWA Push | Haute |

### Module J : Sous-écrans Détaillés (7 écrans)
| # | Écran | Fichier source | Route React | Complexité |
|---|-------|---------------|-------------|------------|
| J1 | Fiche client détaillée | `screen-06-clients.html` | `/clients/:id` | Moyenne |
| J2 | Détail facture (plein écran) | `screen-03b-facture-detail.html` | `/factures/:id/detail` | Moyenne |
| J3 | Historique modification facture | `screen-03b-facture-detail.html` | `/factures/:id/history` | Moyenne |
| J4 | Paramètres — Notifications détaillées | `screen-08-settings.html` | `/settings/notifications` | Faible |
| J5 | Paramètres — Intégrations | `screen-08-settings.html` | `/settings/integrations` | Moyenne |
| J6 | Paramètres — Sécurité | `screen-08-settings.html` | `/settings/security` | Moyenne |
| J7 | Paramètres — Export avancé | `screen-08-settings.html` | `/settings/export` | Moyenne |

---

## 🔢 Phases de Build

### Phase 5.1 — Onboarding + Inscription (Modules A + B)
**Durée estimée** : 3-4 jours  
**Screens** : 8 (A2, A3, A4, A5, B2, B3, B4, B6)

#### Frontend
- [ ] Créer `pages/Onboarding.tsx` avec carousel 4 slides
- [ ] Créer `pages/SetupWizard.tsx` — wizard configuration entreprise
- [ ] Créer `pages/RegisterStep2.tsx` — raison sociale
- [ ] Créer `pages/RegisterStep3.tsx` — NIF/RCCM/adresse
- [ ] Créer `pages/RegisterStep4.tsx` — vérification NIF DGI
- [ ] Créer `pages/OnboardingPost.tsx` — wizard post-inscription
- [ ] Ajouter routes dans `App.tsx`
- [ ] Intégrer les slides depuis `screen-A1-onboarding.html`
- [ ] Ajouter contrôles de progression (step indicator)

#### Backend
- [ ] Table `onboarding_progress` — tracker étapes complétées
- [ ] Table `company_setup` — données configuration initiale
- [ ] Endpoint `POST /api/company/setup` — sauvegarde config initiale
- [ ] Endpoint `POST /api/dgi/verify-nif` — vérification NIF (mock DGI API)
- [ ] RLS policies pour tables onboarding
- [ ] Edge Function `verify-nif-dgi` — intégration API DGI

#### Components
- [ ] `components/onboarding/OnboardingCarousel.tsx`
- [ ] `components/onboarding/OnboardingSlide.tsx`
- [ ] `components/onboarding/SetupWizard.tsx`
- [ ] `components/onboarding/StepIndicator.tsx`
- [ ] `components/forms/CompanyForm.tsx`
- [ ] `components/forms/NifForm.tsx`

---

### Phase 5.2 — Client Detail + Permissions (Modules E + J1)
**Durée estimée** : 2-3 jours  
**Screens** : 3 (E3, E6, J1)

#### Frontend
- [ ] Créer `pages/ClientDetail.tsx` — fiche client détaillée
- [ ] Créer `pages/UserDetail.tsx` — détail/modifier utilisateur
- [ ] Créer `pages/UserInvite.tsx` — invitation utilisateur
- [ ] Ajouter routes dans `App.tsx`
- [ ] Intégrer `screen-06-clients.html` et `screen-E-roles.html`
- [ ] Créer `components/clients/ClientDetailTabs.tsx`
- [ ] Créer `components/users/UserRoleCard.tsx`
- [ ] Créer `components/users/InviteUserModal.tsx`

#### Backend
- [ ] Table `client_details_view` — vue enrichie client (transactions, factures, totaux)
- [ ] Endpoint `GET /api/clients/:id/details` — fiche client complète
- [ ] Table `user_invitations` — gestion invitations email
- [ ] Endpoint `POST /api/users/invite` — envoyer invitation
- [ ] Endpoint `GET /api/users/invitations` — liste invitations
- [ ] Endpoint `DELETE /api/users/invitations/:id` — annuler invitation
- [ ] Edge Function `send-invitation-email` — envoi email invitation

#### Components
- [ ] `components/clients/ClientStatsCard.tsx`
- [ ] `components/clients/ClientTransactionHistory.tsx`
- [ ] `components/clients/ClientFactureHistory.tsx`
- [ ] `components/users/UserPermissionsEditor.tsx`
- [ ] `components/users/InvitationStatusBadge.tsx`

---

### Phase 5.3 — Paramètres Étendus + Modales (Modules J4-J7, C13-C14, G4)
**Durée estimée** : 3-4 jours  
**Screens** : 10 (J4, J5, J6, J7, C13, C14, G4 + 3 sous-écrans)

#### Frontend
- [ ] Créer `pages/SettingsNotifications.tsx`
- [ ] Créer `pages/SettingsIntegrations.tsx`
- [ ] Créer `pages/SettingsSecurity.tsx`
- [ ] Créer `pages/SettingsExport.tsx`
- [ ] Créer `pages/SettingsPOS.tsx`
- [ ] Ajouter routes dans `App.tsx`
- [ ] Créer `components/modals/EditLineItemModal.tsx`
- [ ] Créer `components/modals/GenerateReportModal.tsx`
- [ ] Intégrer depuis `screen-C13-modal-edit-line.html`, `screen-C14-modal-rapport.html`, `screen-G-pos.html`

#### Backend
- [ ] Table `user_notification_preferences` — préférences notifications
- [ ] Table `integrations` — configurations intégrations tierces
- [ ] Table `export_schedules` — exports planifiés
- [ ] Endpoint `GET/PUT /api/settings/notifications`
- [ ] Endpoint `GET/POST/DELETE /api/integrations`
- [ ] Endpoint `POST /api/exports/schedule`
- [ ] Endpoint `GET /api/settings/pos`
- [ ] Edge Function `export-csv` — génération CSV
- [ ] Edge Function `sync-integration` — sync avec intégrations

#### Components
- [ ] `components/settings/NotificationToggle.tsx`
- [ ] `components/settings/IntegrationCard.tsx`
- [ ] `components/settings/SecuritySettings.tsx`
- [ ] `components/settings/ExportScheduler.tsx`
- [ ] `components/modals/EditLineItemModal.tsx`
- [ ] `components/modals/GenerateReportModal.tsx`
- [ ] `components/pos/POSSettings.tsx`

---

### Phase 5.4 — Mobile + Historique + Paiement Carte + Notifications Push (Modules H, J2-J3, F4, D4)
**Durée estimée** : 4-5 jours  
**Screens** : 5 (H4, H6, H7, J2, J3, F4, D4)

#### Frontend
- [ ] Créer `pages/MobileFactures.tsx` — liste factures mobile
- [ ] Créer `pages/MobileFactureDetail.tsx` — détail facture mobile
- [ ] Créer `pages/FactureDetail.tsx` — plein écran
- [ ] Créer `pages/FactureHistory.tsx` — historique modifications
- [ ] Créer `pages/SubscribePayment.tsx` — paiement carte
- [ ] Ajouter routes dans `App.tsx` (y-combinator pour mobile)
- [ ] Intégrer `screen-H-mobile.html`, `screen-03b-facture-detail.html`, `screen-F-abonnement.html`
- [ ] Configurer Service Worker pour notifications push
- [ ] Implémenter `components/mobile/MobileNav.tsx`
- [ ] Implémenter `components/mobile/MobileHeader.tsx`

#### Backend
- [ ] Table `facture_history` — historique modifications factures
- [ ] Table `subscription_plans` — plans tarifaires
- [ ] Table `subscription_payments` — paiements abonnement
- [ ] Endpoint `GET /api/factures/:id/history`
- [ ] Endpoint `POST /api/factures/:id/restore` — restaurer version
- [ ] Endpoint `GET /api/subscriptions/plans`
- [ ] Endpoint `POST /api/subscriptions/payment-card` — paiement Stripe/Mobile
- [ ] Endpoint `POST /api/notifications/push/subscribe` — inscription push
- [ ] Edge Function `facture-history-log` — trigger log modifications
- [ ] Edge Function `process-card-payment` — traitement paiement
- [ ] Service Worker registration pour FCM

#### Components
- [ ] `components/mobile/MobileBottomNav.tsx`
- [ ] `components/factures/FactureDetailView.tsx`
- [ ] `components/factures/FactureHistoryTimeline.tsx`
- [ ] `components/subscribe/PlanSelector.tsx`
- [ ] `components/subscribe/CardPaymentForm.tsx`
- [ ] `components/notifications/PushNotificationPrompt.tsx`

---

## 🏗️ Architecture Composants à Créer

```
src/components/
├── onboarding/
│   ├── OnboardingCarousel.tsx        # Carousel 4 slides
│   ├── OnboardingSlide.tsx           # Slide individuelle
│   ├── SetupWizard.tsx              # Wizard config entreprise
│   └── StepIndicator.tsx            # Indicateur étapes
├── clients/
│   ├── ClientDetailView.tsx         # Fiche client détaillée
│   ├── ClientStatsCard.tsx          # Stats client
│   ├── ClientTransactionHistory.tsx
│   └── ClientFactureHistory.tsx
├── users/
│   ├── UserDetailView.tsx           # Détail utilisateur
│   ├── UserPermissionsEditor.tsx    # Éditeur permissions
│   ├── InviteUserModal.tsx          # Modal invitation
│   └── InvitationStatusBadge.tsx
├── factures/
│   ├── FactureDetailFull.tsx        # Vue plein écran
│   └── FactureHistoryTimeline.tsx   # Historique modifications
├── modals/
│   ├── EditLineItemModal.tsx        # C13
│   └── GenerateReportModal.tsx      # C14
├── settings/
│   ├── SettingsNotifications.tsx    # J4
│   ├── SettingsIntegrations.tsx     # J5
│   ├── SettingsSecurity.tsx         # J6
│   ├── SettingsExport.tsx           # J7
│   └── POSSettings.tsx              # G4
├── mobile/
│   ├── MobileNav.tsx                # Bottom navigation
│   ├── MobileHeader.tsx             # Header mobile
│   ├── MobileFactureList.tsx        # H4
│   └── MobileFactureDetail.tsx      # H6
├── subscribe/
│   ├── PlanSelector.tsx             # Sélection plan
│   └── CardPaymentForm.tsx          # F4
└── notifications/
    └── PushNotificationPrompt.tsx   # D4
```

---

## 🗄️ Base de Données — Nouvelles Tables

```sql
-- Phase 5.1: Onboarding
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  step_completed VARCHAR(50) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, step_completed)
);

CREATE TABLE company_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  rccm VARCHAR(100),
  id_nat VARCHAR(100),
  nif VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 5.2: Users & Clients
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'operateur',
  invited_by UUID REFERENCES auth.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 5.3: Settings
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  email_transaction BOOLEAN DEFAULT true,
  email_facture BOOLEAN DEFAULT true,
  email_dgi BOOLEAN DEFAULT true,
  push_transaction BOOLEAN DEFAULT false,
  push_facture BOOLEAN DEFAULT false,
  push_dgi BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  type VARCHAR(50) NOT NULL, -- 'discord', 'n8n', 'zapier', 'api'
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE export_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'clients', 'factures', 'transactions'
  format VARCHAR(20) NOT NULL DEFAULT 'csv', -- 'csv', 'xlsx', 'pdf'
  frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 5.4: Facture History & Subscriptions
CREATE TABLE facture_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID REFERENCES factures(id) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'status_change', 'delete'
  previous_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  price_cdf DECIMAL(12,2) NOT NULL,
  price_usd DECIMAL(10,2),
  features JSONB NOT NULL DEFAULT '[]',
  max_invoices INTEGER,
  max_users INTEGER,
  max_clients INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  plan_id UUID REFERENCES subscription_plans(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL, -- 'mobile_money', 'card'
  payment_provider VARCHAR(50), -- 'stripe', 'orange', 'vodacom'
  provider_reference VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

---

## 🔌 API Endpoints à Créer

### Phase 5.1
```
POST   /api/company/setup              # Sauvegarde config entreprise
POST   /api/dgi/verify-nif             # Vérification NIF DGI
GET    /api/onboarding/progress         # Récupérer progression
PUT    /api/onboarding/progress/:step   # Marquer étape complétée
```

### Phase 5.2
```
GET    /api/clients/:id/details         # Fiche client complète
POST   /api/users/invite                # Inviter utilisateur
GET    /api/users/invitations           # Liste invitations
DELETE /api/users/invitations/:id       # Annuler invitation
POST   /api/users/invitations/:id/accept # Accepter invitation
```

### Phase 5.3
```
GET    /api/settings/notifications      # Récupérer préférences
PUT    /api/settings/notifications      # Modifier préférences
GET    /api/integrations                # Liste intégrations
POST   /api/integrations                # Créer intégration
DELETE /api/integrations/:id             # Supprimer intégration
POST   /api/integrations/:id/sync       # Sync intégration
GET    /api/export/schedules            # Liste exports planifiés
POST   /api/export/schedules            # Créer export planifié
DELETE /api/export/schedules/:id         # Supprimer export planifié
GET    /api/settings/pos                # Paramètres POS
PUT    /api/settings/pos                # Modifier paramètres POS
```

### Phase 5.4
```
GET    /api/factures/:id/history        # Historique modifications
POST   /api/factures/:id/restore        # Restaurer version
GET    /api/subscriptions/plans          # Liste plans
POST   /api/subscriptions/payment-card  # Paiement carte
GET    /api/subscriptions/current        # Abonnement actuel
POST   /api/notifications/push/subscribe # Subscribe push
DELETE /api/notifications/push/unsubscribe # Unsubscribe push
```

---

## 📦 Edge Functions à Déployer

```
supabase/functions/
├── verify-nif-dgi/                     # Phase 5.1 — Vérification NIF
├── send-invitation-email/              # Phase 5.2 — Email invitation
├── facture-history-log/                # Phase 5.4 — Trigger auto log
├── process-card-payment/               # Phase 5.4 — Paiement Stripe
├── export-csv/                         # Phase 5.3 — Génération CSV
└── sync-integration/                   # Phase 5.3 — Sync Discord/n8n
```

---

## 🧪 Tests Requis

### Phase 5.1 — Onboarding
- [ ] Test flux inscription 4 étapes
- [ ] Test validation NIF (valide/invalide)
- [ ] Test setup wizard → création entreprise
- [ ] Test progression onboarding sauvegardée

### Phase 5.2 — Users
- [ ] Test envoi invitation email
- [ ] Test acceptation invitation avec token
- [ ] Test fiche client avec historique complet
- [ ] Test permissions utilisateur modifié

### Phase 5.3 — Settings
- [ ] Test toggle notifications
- [ ] Test ajout/suppression intégration
- [ ] Test export planifié (CRON)
- [ ] Test modal édition ligne produit

### Phase 5.4 — Mobile + History
- [ ] Test affichage mobile responsive
- [ ] Test historique modifications facture
- [ ] Test restauration version antérieure
- [ ] Test paiement par carte
- [ ] Test notifications push

---

## 📅 Ordre d'Implémentation Suggéré

```
Week 1 (Phase 5.1):
├── Jours 1-2 : Setup routes + composants Onboarding
├── Jours 3-4 : Backend tables + endpoints
└── Jours 5   : Integration + tests

Week 2 (Phase 5.2):
├── Jours 1-2 : ClientDetail + UserDetail pages
├── Jours 3-4 : Backend user invitations
└── Jours 5   : Integration + tests

Week 3 (Phase 5.3):
├── Jours 1-2 : Settings pages (notifications, integrations, security, export)
├── Jours 3-4 : Modales C13/C14 + POS settings
└── Jours 5   : Integration + tests

Week 4 (Phase 5.4):
├── Jours 1-2 : Mobile pages + Facture detail/history
├── Jours 3-4 : Subscription + Paiement carte
└── Jours 5   : Push notifications + tests finaux
```

---

## ⚠️ Points d'attention

1. **RLS Policies** — Toutes nouvelles tables nécessitent des policies RLS
2. **Mobile-first** — Les composants Phase 5.4 doivent être mobile-first
3. **DGI API** — L'intégration NIF DGI nécessite des credentials API réels
4. **Paiement** — Stripe/Mobile Money nécessitent configuration merchant
5. **Service Worker** — Notifications push nécessitent HTTPS + FCM setup
6. **Débt technique** — 47 hooks avec logique dupliquée (voir ARCHITECTURE.md)

---

## ✅ Checklist de Livraison Phase 5

- [ ] 26 écrans livrés et intégrés
- [ ] Toutes les routes dans `App.tsx`
- [ ] Toutes les tables RLS créées
- [ ] Tous les endpoints testés
- [ ] Edge Functions déployées
- [ ] Tests unitaires > 80% coverage sur nouveaux fichiers
- [ ] Documentation mise à jour (ARCHITECTURE.md, README.md)
- [ ] PR créée et approuvée

---

*Document généré automatiquement — 23 Avril 2026*  
*Plan de build Phase 5 — FactureSmart*
