# 🔐 Authentification & Onboarding — Guide Complet

> Version : 1.0 | Statut : ✅ Production | Mise à jour : Avril 2026

## Vue d'ensemble

Système d'authentification complet avec onboarding multi-étapes, RBAC (Role-Based Access Control), et Setup Wizard pour les nouvelles entreprises.

---

## Pages

### 1. Login (`Login.tsx`)
- Interface redessinée avec design glassmorphism
- Support email + mot de passe
- Redirection post-connexion selon rôle
- Gestion des sessions

### 2. Register (`Register.tsx`)
- Inscription multi-étapes
- Validation des champs avec Zod
- Création du compte Supabase Auth

### 3. Onboarding (`Onboarding.tsx`)
- Processus guidé pour les nouveaux utilisateurs
- Configuration du profil
- Paramétrage initial

### 4. Setup Wizard (`SetupWizard.tsx`)
- Assistant de configuration entreprise
- Étapes :
  1. **Informations entreprise** — Nom, adresse, NIF, RC
  2. **Configuration fiscale** — Régime, taux TVA
  3. **Devise par défaut** — FC, USD
  4. **Notifications** — Préférences par défaut
  5. **Invitation équipe** — Ajout de membres

---

## RBAC (Role-Based Access Control)

### Rôles disponibles

| Rôle | Accès | Description |
|------|-------|-------------|
| `super_admin` | 🟢 Total | Configuration système, tout accès |
| `admin` | 🟢 Complet | Gestion complète sauf config système |
| `operateur` | 🟡 Limité | Pas de finances, DGI, compta |
| `comptable` | 🔵 Lecture finances | Finances en lecture seule |
| `declarant` | 🟠 DGI limité | Module DGI en lecture/écriture limitée |

### Composants de protection

```tsx
// Protection basique
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Protection enrichie (avec vérification RBAC)
import { ProtectedRouteEnhanced } from "@/components/auth/ProtectedRouteEnhanced";

// HOC
import { withProtection } from "@/components/auth/withProtection";

const ProtectedPage = withProtection(MyComponent, { 
  requiredRole: "admin" 
});
```

---

## Composants

| Composant | Rôle | Fichier |
|-----------|------|---------|
| `ProtectedRoute` | Vérifie l'authentification | `components/auth/ProtectedRoute.tsx` |
| `ProtectedRouteEnhanced` | Vérifie auth + permissions | `components/auth/ProtectedRouteEnhanced.tsx` |
| `withProtection` | HOC pour pages protégées | `components/auth/withProtection.tsx` |

---

## Migration SQL

```sql
-- Table des profils
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  role TEXT NOT NULL DEFAULT 'operateur' 
    CHECK (role IN ('super_admin','admin','operateur','comptable','declarant')),
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des organisations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nif TEXT,
  rc TEXT,
  fiscal_regime TEXT,
  default_currency TEXT DEFAULT 'CDF',
  setup_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Flux Onboarding

```
Inscription → Profil → Setup Wizard → Invitation équipe → Dashboard
     │           │           │               │                │
     │           │           │               │                │
     └───────────┴───────────┴───────────────┴────────────────┘
                         Si échec à une étape, l'utilisateur
                         est redirigé vers cette étape
```

---

*Document mis à jour en Avril 2026*
