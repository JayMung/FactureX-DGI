# 📋 PRD — FactureSmart v2.0
## Product Requirements Document

> **Version** : 2.0  
> **Date** : Avril 2026  
> **Status** : En production — Sprint 2 en cours  
> **Workspace** : Codev (Multica)  

---

## 1. Contexte & Vision

### 1.1 Problème à Résoudre

Les PME/PMI de la République Démocratique du Congo (RDC) souffrent d'un manque d'outils de gestion empresarial adaptés à leur contexte :
- **Absence de conformité fiscale** avec la DGI (Direction Générale des Impôts)
- **Outils de comptabilité manuels** ou inadaptés au plan OHADA
- **Pas de traçabilité** des transactions et des paiements
- **Gestion分散** (fragmentée) entre clients, factures et finances

### 1.2 Solution

**FactureSmart** est une application SaaS de gestion empresarial tout-en-un pour la RDC :
- ✅ Génération de factures et devis conformes DGI
- ✅ Gestion clients, transactions et paiements
- ✅ Module POS (Point of Sale) pour caisse tactile
- ✅ Comptabilité OHADA (SYSCOHADA)
- ✅ Conformité fiscale en temps réel
- ✅ Notifications push et rappels automatiques

### 1.3 Positionnement

| Aspect | FactureSmart | Concurrence |
|--------|-------------|-------------|
| Cible | PME/PMI RDC | Générique |
| Prix | Indicatif – devis personnalisé | Abonnement fixe |
| Conformité | DGI intégrée | Externe/manual |
| OHADA | ✅ Native | ❌ |
| Mobile Money | ✅ Intégré | Limité |

---

## 2. Modules & Fonctionnalités

### 2.1 Module Authentification & Onboarding ✅ Livré

| Fonctionnalité | Status |
|----------------|--------|
| Login avec email/NIF | ✅ |
| Inscription multi-étapes | ✅ |
| Setup Wizard (config entreprise) | ✅ |
| Onboarding complet (A1→A5) | ✅ |
| OAuth Google/Microsoft (mock) | ✅ |
| RBAC (rôles et permissions) | ✅ |

**Rôles disponibles** :
- `Super Admin` : Accès complet
- `Admin` : Gestion complète sauf config système
- `Opérateur` : Accès limité (pas finances/DGI/comptabilité)
- `Comptable` : Lecture finances
- `Déclarant` : Module DGI restreint

---

### 2.2 Module Facturation ✅ Livré

| Fonctionnalité | Status | Fichier |
|----------------|--------|---------|
| Liste factures | ✅ | `Factures-Protected.tsx` |
| Création facture | ✅ | `Factures-Create.tsx` |
| Détail facture | ✅ | `Factures-View.tsx` |
| Aperçu/Preview | ✅ | `Factures-Preview.tsx` |
| PDF génération | ✅ | `react-pdf` + Puppeteer |
| Calcul auto HT/TVA/TTC | ✅ | COD-32-7 |
| Envoi Email | ✅ | `services/email.ts` |
| Envoi WhatsApp | ✅ | `services/whatsapp.ts` |
| Suppression facture | ✅ | COD-32-4 |
| Devis | ✅ | `Devis.tsx` |

**Route DGI** :
- `/factures/:id/dgi-status` — Suivi conformité DGI ✅

---

### 2.3 Module Clients ✅ Livré

| Fonctionnalité | Status | Fichier |
|----------------|--------|---------|
| Liste clients | ✅ | `Clients-Protected.tsx` |
| Fiche détail client | ✅ | COD-33-2 |
| Création/Édition client | ✅ | COD-33-3 |
| Historique client | ✅ | `ClientHistoryModal.tsx` |
| Factures impayées client | ✅ | `useClientUnpaidFactures.ts` |
| Import CSV clients | ✅ | `ClientsImporter.tsx` |

---

### 2.4 Module Transactions ✅ Livré

| Fonctionnalité | Status |
|----------------|--------|
| Liste transactions | ✅ |
| CRUD transactions | ✅ |
| Filtres et pagination | ✅ |
| Import CSV transactions | ✅ |
| Opérations en masse | ✅ |

---

### 2.5 Module Finances 🔐 Admin Uniquement

| Fonctionnalité | Status |
|----------------|--------|
| Dashboard KPIs | ✅ |
| Opérations financières | ✅ |
| Comptes financiers | ✅ |
| Mouvements de comptes | ✅ |
| Encaissements | ✅ |
| Rapports financiers | ✅ |
| Transferts entre comptes | ✅ |

---

### 2.6 Module DGI (Conformité Fiscale) ✅ Livré

| Fonctionnalité | Status |
|----------------|--------|
| API Proxy DGI | ✅ |
| Rate limiting | ✅ |
| Soumission factures | ✅ |
| Validation format | ✅ |
| Suivi statut temps réel | ✅ |
| Mock DGI (dev) | ✅ |

**Edge Functions** :
- `api-dgi-proxy` — Proxy avec rate limiter
- `api-dgi-submit` — Soumission factures
- `api-dgi-validate` — Validation format
- `mock-dgi-*` — Mock développement

---

### 2.7 Module Notifications 🔔 Nouveau

| Fonctionnalité | Status |
|----------------|--------|
| Notification Center | ✅ |
| Notification Card | ✅ |
| Service Worker PWA | ✅ |
| Push subscriptions | ✅ |
| Paramètres par type | ✅ |
| Notifications temps réel | ✅ |

---

### 2.8 Module POS & Caisse 🚧 En Développement

| Fonctionnalité | Status |
|----------------|--------|
| Interface caisse tactile | ✅ (COD-34-1) |
| Checkout multi-modes | ✅ (COD-34-2) |
| Ticket thermal/reçu | ✅ (COD-34-3) |
| Catalogue produits | 🚧 |
| Catégories produits | 🚧 |
| Session caisse temps réel | 🚧 |

**Pages à créer** :
- `/pos` — Interface principale
- `/pos/catalogue` — Catalogue produits
- `/pos/checkout` — Paiement
- `/pos/settings` — Paramètres
- `/pos/recu/:id` — Reçu
- `/pos/historique` — Historique

**Caisse quotidienne** :
- `/caisse/ouverture` — Ouverture
- `/caisse/journal` — Journal
- `/caisse/fermeture` — Fermeture
- `/caisse/transfert` — Transfert vers banque

---

### 2.9 Module Comptabilité OHADA 📋 Planifié

| Fonctionnalité | Status |
|----------------|--------|
| Plan comptable SYSCOHADA | ✅ (COD-35-1) |
| Journal écritures | ✅ (COD-35-2) |
| États financiers | ✅ (COD-35-3) |
| Journal (K2) | ❌ À faire |
| Grand Livre (K3) | ❌ À faire |
| Balance (K4) | ❌ À faire |
| Compte de résultat (K5) | ❌ À faire |
| Bilan (K6) | ❌ À faire |
| Trésorerie (K7) | ❌ À faire |
| Relevé bancaire (K8) | ❌ À faire |
| Export OHADA XML/PDF (K9) | ❌ À faire |

---

### 2.10 Module Rapports & Paramètres 📋 Planifié

| Fonctionnalité | Status |
|----------------|--------|
| Rapports financiers | 🚧 |
| Paramètres généraux | 🚧 |
| Gestion rôles/permissions | 🚧 |
| User invite | ✅ |
| Paramètres notifications | 🚧 |
| Paramètres intégrations | 🚧 |
| Paramètres sécurité | 🚧 |
| Export avancé | 🚧 |
| Abonnements & Payments | 📋 |

---

## 3. Avancement Global

### 3.1 Statut par Phase

| Phase | Total | ✅ Done | 🚧 In Progress | ❌ To Do |
|-------|-------|---------|----------------|---------|
| Phase 1 — Auth | 6 | 6 | 0 | 0 |
| Phase 2 — Facturation | 9 | 7 | 0 | 2 |
| Phase 3 — Clients | 3 | 3 | 0 | 0 |
| Phase 4 — POS | 10 | 3 | 0 | 7 |
| Phase 5 — OHADA | 9 | 3 | 0 | 6 |
| Phase 6 — Rapports | 11 | 5 | 0 | 6 |
| Phase 7 — Mobile | 6 | 0 | 0 | 6 |
| Phase 8 — Landing | 1 | 0 | 0 | 1 |
| **TOTAL** | **62** | **27** | **0** | **35** |

### 3.2 Sprint en Cours

**Sprint 2 — Core Facturation**
- Branche : `sprint-2-core-facturation`
- Status : ✅ Phase 2 mostly livrée
- Tâches restantes :
  - COD-26: DGI API credentials (Kimi)
  - COD-28: Schema DB `invoice_history`
  - Écrans: InvoiceDetailFull, InvoiceHistory

---

## 4. Stack Technique

### 4.1 Frontend
| Technologie | Version |
|------------|---------|
| React | 18 |
| TypeScript | 5+ |
| Vite | 6 |
| Tailwind CSS | 4 |
| shadcn/ui | latest |
| React Query (TanStack) | latest |
| React Router | v6 |
| Zod | validation |
| Recharts | graphs |
| React Hook Form | forms |

### 4.2 Backend
| Service | Technologie |
|---------|-------------|
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Edge Functions | Deno |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |

### 4.3 Design System
- **Brand Color** : Vert émeraude (#10B981)
- **Glassmorphism** : Emerald glassmorphism
- **Icons** : Remixicon (CDN)
- **Fonts** : Plus Jakarta Sans

---

## 5. Sécurité

### 5.1 Mesures Implémentées

| Mesure | Status |
|--------|--------|
| Multi-tenancy (isolation org) | ✅ |
| Row Level Security (RLS) | ✅ |
| Permissions granulaires | ✅ |
| CSRF protection | ✅ |
| XSS protection | ✅ |
| Rate limiting | ✅ |
| Session management | ✅ |
| Audit logs | ✅ |

### 5.2 Dette Technique Identifiée

| Problème | Priorité | Solution |
|----------|----------|----------|
| Duplication hooks (~47) | ⚠️ CRITIQUE | Hook générique `useSupabaseQuery` |
| Validation分散 (7 fichiers) | ⚠️ MOYEN | Schémas Zod centralisés |
| 0 tests automatisés | ⚠️ CRITIQUE | Vitest + GitHub Actions |

---

## 6. API & Intégrations

### 6.1 Endpoints REST

| Endpoint | Description |
|----------|-------------|
| `/api/clients` | CRUD clients |
| `/api/factures` | CRUD factures |
| `/api/transactions` | CRUD transactions |
| `/api/colis` | CRUD colis |
| `/api/stats` | Statistiques dashboard |

### 6.2 Intégrations Supportées

| Service | Status |
|---------|--------|
| Discord (webhooks) | ✅ |
| Slack (webhooks) | ✅ |
| n8n (webhooks) | ✅ |
| Mobile Money (Airtel, Orange, M-Pesa) | 🚧 |

---

## 7. Métriques Projet

| Métrique | Valeur |
|----------|--------|
| Lignes de code | ~60,000+ |
| Composants React | 200+ |
| Hooks | 55+ |
| Pages | 55+ |
| Edge Functions | 20+ |
| Tables DB | 60+ |
| Migrations SQL | 15+ |
| Mockups haute fidélité | 50+ |

---

## 8. Équipe & Workflow

### 8.1 Branches Git

```
main ────────────────────────────── ✅ Stable
  └── sprint-2-core-facturation ─── 🚧 En cours
```

### 8.2 Processus CI/CD

1. Branche feature → PR
2. Review par 1 agent minimum
3. Merge vers `main`
4. Auto-deploy vers Vercel

### 8.3 Outils

| Outil | Usage |
|-------|-------|
| Multica | Gestion tâches & agents |
| GitHub | Code & PR reviews |
| Vercel | Déploiement auto |
| Supabase | Backend-as-a-Service |

---

## 9. Prochaines Étapes

### 9.1 Sprint 2 Restants
- [ ] COD-26: DGI API credentials (Kimi)
- [ ] COD-28: Schema `invoice_history`
- [ ] InvoiceDetailFull (J2)
- [ ] InvoiceHistory (J3)

### 9.2 Sprint 3 — POS & Caisse
- [ ] Module POS complet (G1→G6)
- [ ] Caisse quotidienne (L1→L4)

### 9.3 Sprint 4 — OHADA
- [ ] Journal (K2)
- [ ] Grand Livre (K3)
- [ ] Balance (K4)
- [ ] États financiers (K5, K6)

---

*Document généré Avril 2026 — FactureSmart v2.0*
