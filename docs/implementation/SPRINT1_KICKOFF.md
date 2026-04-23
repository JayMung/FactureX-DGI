# 🚀 Sprint 1 Kickoff — Auth + Onboarding

**Date** : 23 Avril 2026
**Durée** : 2 semaines
**Objectif** : Auth multi-facteurs + Flow onboarding complet

---

## 📋 Écrans à implémenter (14 écrans)

### Auth
| # | Fichier maquette | Route React | Status |
|---|-----------------|------------|--------|
| 1 | `screen-00-login.html` | `/login` | À faire |
| 2 | `screen-B-inscription.html` | `/register` | À faire |
| 3 | `screen-B2-inscription-company.html` | `/register/step-2` | À faire |
| 4 | `screen-B3-inscription-nif.html` | `/register/step-3` | À faire |
| 5 | `screen-B4-inscription-verify.html` | `/register/verify` | À faire |

### Onboarding
| # | Fichier maquette | Route React | Status |
|---|-----------------|------------|--------|
| 6 | `screen-A1-onboarding.html` | `/onboarding` | À faire |
| 7 | `screen-A2-onboarding-create.html` | `/onboarding` (slide) | À faire |
| 8 | `screen-A3-onboarding-dgi.html` | `/onboarding` (slide) | À faire |
| 9 | `screen-A4-onboarding-complete.html` | `/onboarding/complete` | À faire |
| 10 | `screen-A5-setup-wizard.html` | `/setup` | À faire |
| 11 | `screen-B6-onboarding-post.html` | `/onboarding/post-register` | À faire |

### Users & Roles
| # | Fichier maquette | Route React | Status |
|---|-----------------|------------|--------|
| 12 | `screen-E-roles.html` | `/settings/roles` | À faire |
| 13 | `screen-E3-user-edit.html` | `/users/:id` | À faire |
| 14 | `screen-E6-user-invite.html` | `/users/invite` | À faire |

---

## 🗄️ Backend tables nécessaires

```sql
-- companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  rccm VARCHAR(100),
  id_nat VARCHAR(100),
  nif VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  logo_url TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- nif_verification
CREATE TABLE nif_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  nif VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  dgi_response JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_invitations
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

-- onboarding_progress
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  step_completed VARCHAR(50) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, step_completed)
);
```

---

## 🔌 API Endpoints Sprint 1

```
Auth:
POST   /api/auth/register              Inscription
POST   /api/auth/login                Connexion
POST   /api/auth/logout               Déconnexion
GET    /api/auth/session              Vérifier session

Companies:
POST   /api/companies                 Créer entreprise
GET    /api/companies/:id             Récupérer entreprise
PUT    /api/companies/:id             Modifier entreprise

NIF:
POST   /api/nif/verify                Vérifier NIF (DGI)
GET    /api/nif/status/:company_id    Statut vérification

Onboarding:
GET    /api/onboarding/progress       Récupérer progression
PUT    /api/onboarding/progress/:step Marquer étape complétée

Users:
GET    /api/users                     Liste utilisateurs
POST   /api/users/invite              Inviter utilisateur
GET    /api/users/invitations         Liste invitations
DELETE /api/users/invitations/:id     Annuler invitation
PUT    /api/users/:id                 Modifier utilisateur
DELETE /api/users/:id                 Désactiver utilisateur

Roles:
GET    /api/roles                     Liste rôles
GET    /api/roles/:id/permissions     Permissions rôle
PUT    /api/roles/:id                 Modifier rôle
```

---

## 🎯 Definition of Done Sprint 1

- [ ] Login avec email/password fonctionne
- [ ] OAuth Google fonctionnel
- [ ] Inscription 4 étapes validée
- [ ] Vérification NIF DGI (mock si API pas prête)
- [ ] Setup wizard entreprise fonctionnel
- [ ] Onboarding carousel 4 slides
- [ ] Gestion utilisateurs (CRUD)
- [ ] Gestion rôles (RBAC)
- [ ] Invitation utilisateur par email
- [ ] Toutes les routes protégées
- [ ] RLS sur toutes les tables
- [ ] Tests > 70% coverage backend

---

## ⚠️ Dépendances externes

| Dépendance | Status | Action requise |
|-----------|--------|---------------|
| Supabase production | ✅ Configuré | Valider credentials |
| OAuth Google | ❌ À configurer | GCP Console project |
| OAuth Microsoft | ❌ À configurer | Azure AD app |
| API DGI (NIF) | ❌ Non disponible | Utiliser mock + COD-26 |
| Service email | ❌ À configurer | Resend / SendGrid |

---

## 👥 Équipe

- **Dev 1** (MiniClaw) : Auth + Inscription + Onboarding
- **Dev 2** (TBD) : Users + Roles + Invitations

---

## 📦 Checklist démarrage Dev 2

- [ ] Accès repo GitHub (`JayMung/FactureSmart-DGI`)
- [ ] Accès Supabase (projet production)
- [ ] Accès Vercel (déploiement)
- [ ] Briefing architecture (ce document)
- [ ] Convention code partagées

---

*Sprint 1 Kickoff — 23 Avril 2026*
