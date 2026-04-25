# 🏗️ ARCHITECTURE FACTUREX

> Documentation technique du projet FactureSmart v2.0  
> Dernière mise à jour : Avril 2026

---

## 📁 Structure du Projet

```
FactureSmart/
├── src/
│   ├── components/          # 30+ dossiers de composants UI
│   │   ├── activity/        # Logs d'activité
│   │   ├── admin/           # Composants d'administration
│   │   ├── auth/            # Authentification (ProtectedRoute, withProtection)
│   │   ├── charts/          # Graphiques (Recharts)
│   │   ├── clients/         # Gestion clients + historique
│   │   ├── colis-maritime/  # Suivi colis & containers
│   │   ├── comptes/         # Gestion comptes financiers
│   │   ├── dashboard/       # Tableaux de bord
│   │   ├── duplicates/      # Détection de doublons
│   │   ├── factures/        # Composants factures (InvoicePaper)
│   │   ├── filters/         # Filtres réutilisables
│   │   ├── forms/           # Formulaires (ClientForm, FactureFormAccordion)
│   │   ├── import/          # Import CSV (clients, transactions, rapport)
│   │   ├── layout/          # Layout principal (Header, Sidebar)
│   │   ├── modals/          # Modales réutilisables
│   │   ├── notifications/   # Hub notifications + réglages
│   │   ├── payments/        # Paiements
│   │   ├── permissions/     # Gestion permissions
│   │   ├── reports/         # Rapports financiers
│   │   ├── security/        # Composants sécurité
│   │   ├── settings/        # Paramètres
│   │   ├── transactions/    # Transactions financières
│   │   ├── ui/              # Composants shadcn/ui
│   │   └── workflow/        # Workflow validation
│   │
│   ├── hooks/               # 55+ hooks React Query
│   │   ├── useTransactions.ts
│   │   ├── useColis.ts
│   │   ├── useClients.ts
│   │   ├── useFactures.ts
│   │   ├── useFactureHistory.ts
│   │   ├── useComptesFinanciers.ts
│   │   ├── usePaiements.ts
│   │   ├── useMouvementsComptes.ts
│   │   ├── usePermissions.ts
│   │   ├── useApprovalWorkflow.ts
│   │   ├── useFinancialOperations.ts
│   │   ├── useDashboardDgi.ts
│   │   ├── useNotifications.ts
│   │   ├── useArticles.ts
│   │   ├── useComptabiliteAI.ts
│   │   ├── useSorting.ts
│   │   └── ... (40+ autres hooks)
│   │
│   ├── pages/               # 55+ pages principales
│   │   ├── Index.tsx                           # Landing page publique
│   │   ├── Index-Protected.tsx                 # Dashboard connecté
│   │   ├── Login.tsx                           # Connexion redessinée
│   │   ├── Register.tsx                        # Inscription multi-étapes
│   │   ├── Onboarding.tsx                      # Processus onboarding complet
│   │   ├── SetupWizard.tsx                     # Assistant configuration entreprise
│   │   ├── Transactions-Protected.tsx          # Transactions
│   │   ├── Clients-Protected.tsx               # Gestion clients
│   │   ├── Factures-*.tsx                      # 8 pages factures (List, Create, Detail, Preview, View)
│   │   ├── Devis.tsx                           # Gestion devis
│   │   ├── DgiStatus.tsx                       # Suivi statut DGI
│   │   ├── Colis-*.tsx                         # 3 pages colis
│   │   ├── Comptes-Finances.tsx                # Comptes financiers
│   │   ├── Encaissements.tsx                   # Encaissements
│   │   ├── Operations-Financieres.tsx          # Opérations
│   │   ├── Rapports.tsx                        # Rapports financiers
│   │   ├── Financial-Reports.tsx               # Rapports avancés
│   │   ├── Settings.tsx                        # Paramètres généraux
│   │   ├── NotificationSettings.tsx            # Réglages notifications
│   │   ├── ApiKeys.tsx                         # Gestion clés API
│   │   ├── Webhooks.tsx                        # Configuration webhooks
│   │   ├── ActivityLogs.tsx                    # Logs d'activité
│   │   ├── SecurityAudit.tsx                   # Audit de sécurité
│   │   ├── SecurityDashboard.tsx               # Dashboard sécurité
│   │   ├── Permission-Diagnostic.tsx           # Diagnostic permissions
│   │   ├── Settings-Permissions.tsx            # Gestion permissions
│   │   ├── UserInvite.tsx                      # Invitation utilisateurs
│   │   ├── AdminInvitation.tsx                 # Invitation admin
│   │   ├── POS-Caisse.tsx                      # Module point de vente
│   │   ├── Compta-*.tsx                        # Pages comptabilité OHADA
│   │   └── ... (autres pages)
│   │
│   ├── services/            # Services API
│   │   ├── supabase.ts      # Client Supabase principal
│   │   ├── supabase-extended.ts
│   │   ├── activityLogger.ts
│   │   ├── adminService.ts
│   │   ├── permissionsService.ts
│   │   ├── securityLogger.ts
│   │   ├── dgi.ts                              # Client DGI proxy
│   │   ├── email.ts                            # Service email
│   │   ├── invoiceSender.ts                    # Envoi factures
│   │   ├── mobileMoney.ts                      # Mobilité money
│   │   ├── notificationSender.ts               # Envoi notifications
│   │   ├── notificationService.ts              # Gestion notifications
│   │   ├── reportService.ts                    # Génération rapports
│   │   └── whatsapp.ts                         # Intégration WhatsApp
│   │
│   ├── integrations/
│   │   └── supabase/        # Configuration Supabase
│   │
│   ├── lib/                 # Utilitaires & validations
│   │   ├── security/        # Sécurité CSRF, XSS, Rate limiting
│   │   ├── validation.ts    # Validation Zod
│   │   ├── input-validation.ts
│   │   ├── password-validation.ts
│   │   ├── financial-validation-handler.ts
│   │   ├── rate-limit-server.ts
│   │   └── animations.ts
│   │
│   ├── contexts/            # React Contexts
│   ├── types/               # Types TypeScript
│   ├── utils/               # Utilitaires
│   └── styles/              # CSS global
│
├── supabase/
│   ├── functions/           # Edge Functions (Deno)
│   │   ├── webhook-transaction/
│   │   ├── webhook-processor/
│   │   ├── agent-comptable/
│   │   ├── api-*/
│   │   └── _shared/
│   │
│   └── migrations/          # Migrations SQL
│
└── public/                  # Assets statiques
```

### Assets statiques (public/)
```
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service Worker (notifications push)
│   ├── screen-02-factures.html
│   └── screen-05-dgi-status.html
```

### Mockups validés (mockups-v2/)
```
├── mockups-v2/              # 50+ maquettes haute fidélité
│   ├── DESIGN_PLAN.md
│   ├── DESIGN_SYSTEM.md
│   ├── index.html
│   ├── screen-*.html        # Landing, Login, Dashboard, Factures,
│   │                        # Clients, DGI, Rapports, Settings,
│   │                        # POS, Comptabilité OHADA, Mobile, etc.
│   └── screen-*.html        # Onboarding, SetupWizard, Notifications
```

---

## 🎣 Principaux Hooks (Rôle & Responsabilité)

### 🔤 Transactions & Finance
| Hook | Rôle |
|------|------|
| `useTransactions.ts` | CRUD complet, pagination, filtres transactions |
| `useFinancialOperations.ts` | Opérations financières complexes (swap, transfert) |
| `useFinanceStatsByPeriod.ts` | Statistiques financières par période |
| `useMouvementsComptes.ts` | Historique mouvements comptes |
| `useFinanceCategories.ts` | Catégories financières |
| `useFinancialValidation.ts` | Validation montants financiers |
| `useFinancialReports.ts` | Génération rapports |

### 📦 Colis & Logistique
| Hook | Rôle |
|------|------|
| `useColis.ts` | CRUD colis aérien/maritime |
| `useColisList.ts` | Liste paginée colis |
| `useColisMaritime.ts` | Containers maritimes |
| `useDeleteColis.ts` | Suppression colis avec logs |
| `useUpdateColisStatut.ts` | Mise à jour statuts |

### 👥 Clients & Relations
| Hook | Rôle |
|------|------|
| `useClients.ts` | CRUD clients |
| `useClientHistory.ts` | Historique client |
| `useClientUnpaidFactures.ts` | Factures impayées client |

### 📄 Facturation & DGI
| Hook | Rôle |
|------|------|
| `useFactures.ts` | CRUD factures (19KB - complexe) |
| `useFactureHistory.ts` | Historique des modifications facture |
| `usePaiements.ts` | Paiements & encaissements |
| `usePaymentMethods.ts` | Modes de paiement |
| `useDashboardDgi.ts` | Dashboard conformité DGI |
| `useArticles.ts` | Gestion des articles/produits |

### 🔐 Sécurité & Permissions
| Hook | Rôle |
|------|------|
| `usePermissions.ts` | Permissions granulaires (11KB) |
| `useApprovalWorkflow.ts` | Workflow validation transactions |
| `useApiKeys.ts` | Gestion API keys |
| `useWebhooks.ts` | Configuration webhooks |
| `useRealTimeActivity.ts` | Logs temps réel |
| `useNotificationPreferences.ts` | Préférences notifications |

### 📊 Dashboard & Rapports
| Hook | Rôle |
|------|------|
| `useDashboard.ts` | Dashboard principal |
| `useDashboardAnalytics.ts` | Analytics dashboard |
| `useDashboardWithPermissions.ts` | Dashboard avec permissions |

### 🔔 Notifications
| Hook | Rôle |
|------|------|
| `useNotifications.ts` | CRUD notifications, marquage lu, push |

### 📊 Comptabilité
| Hook | Rôle |
|------|------|
| `useComptabiliteAI.ts` | Analyse comptable assistée IA |
| `useComptesFinanciers.ts` | Gestion comptes financiers avancés |
| `useSorting.ts` | Tri multi-colonnes pour tableaux |

### 🔧 Opérations
| Hook | Rôle |
|------|------|
| `useBulkOperations.ts` | Opérations en masse |
| `useExtendedBulkOperations.ts` | Opérations avancées |
| `useExtendedSelection.ts` | Sélection multiple |
| `useAutoSave.ts` | Sauvegarde automatique |
| `useFormValidation.ts` | Validation formulaires |

---

## 🧩 Rôle des Principaux Composants

### Layout & Navigation
- **`layout/MainLayout.tsx`** - Layout principal avec sidebar
- **`layout/Header.tsx`** - En-tête avec indicateur notifications
- **`layout/Sidebar.tsx`** - Navigation latérale avec permissions

### Transactions
- **`transactions/TransactionList.tsx`** - Liste transactions
- **`transactions/TransactionForm.tsx`** - Formulaire création
- **`transactions/TransactionStats.tsx`** - Statistiques

### Finances
- **`comptes/CompteCard.tsx`** - Carte compte financier
- **`comptes/SoldeBadge.tsx`** - Badge solde
- **`charts/FinancialChart.tsx`** - Graphique financier

### Authentification
- **`auth/ProtectedRoute.tsx`** - Route protégée (RBAC)
- **`auth/ProtectedRouteEnhanced.tsx`** - Route protégée enrichie
- **`auth/withProtection.tsx`** - HOC protection routes

### Factures
- **`factures/InvoicePaper.tsx`** - Composant d'impression/aperçu facture
- **`forms/FactureFormAccordion.tsx`** - Formulaire création facture

### Notifications
- **`notifications/NotificationCard.tsx`** - Carte notification individuelle
- **`notifications/NotificationCenter.tsx`** - Centre de notifications central
- **`notifications/NotificationSettingsTab.tsx`** - Paramètres notifications par type

### Clients
- **`clients/ClientHistoryModal.tsx`** - Historique complet client

### Import
- **`import/CSVImporter.tsx`** - Import CSV générique
- **`import/ClientsImporter.tsx`** - Import clients
- **`import/TransactionsImporter.tsx`** - Import transactions
- **`import/import-report.tsx`** - Rapport d'import

### Sécurité
- **`security/PermissionGuard.tsx`** - Garde permissions
- **`security/AuditLog.tsx`** - Journal d'audit
- **`security/ActivityLogsTab.tsx`** - Logs d'activité
- **`security/AuditTrailTab.tsx`** - Piste d'audit
- **`security/SecurityAlertsTab.tsx`** - Alertes sécurité
- **`security/SecurityLogsTab.tsx`** - Logs sécurité

### Workflow
- **`workflow/PendingApprovals.tsx`** - Approbations en attente

---

## 🔴 Dette Technique Identifiée (3 points prioritaires)

### 1. **Duplication de code dans les Hooks** ⚠️ CRITIQUE

**Problème** : 
- 47 hooks avec beaucoup de logique dupliquée
- `useBulkOperations.ts` et `useExtendedBulkOperations.ts` → ~70% code commun
- `useColis.ts` et `useColisList.ts` → logique similaire
- Gestion error & loading duplicée

**Exemple de duplication** :
```typescript
// Dans useTransactions.ts, useColis.ts, useClients.ts, etc.
const { data, error, isLoading } = await supabase
  .from(table)
  .select()
  .eq('organization_id', orgId);

if (error) {
  toast.error(error.message);
  return { success: false, error };
}
```

**Solution recommandée** :
- Créer un **hook générique** `useSupabaseQuery(table, options)`
- Factoriser la gestion error/loading
- Réduire de 30-40% le code hooks

---

### 2. **Validation分散 (Fragmentée)** ⚠️ MOYEN

**Problème** :
- 7 fichiers de validation différents :
  - `lib/validation.ts` (12KB)
  - `lib/input-validation.ts` (11KB)
  - `lib/financial-validation-handler.ts`
  - `lib/password-validation.ts`
  - `lib/form-validation.ts`
  - `lib/xss-protection.ts`
  - `lib/csrf-protection.ts`
- Overlapping et redondance
- Pas de schéma Zod centralisé

**Solution recommandée** :
- Créer **un seul fichier** `lib/schemas.ts` avec tous les schémas Zod
- Utiliser `zod` pour validation unifiée frontend/backend
- Unifier `input-validation.ts` et `validation.ts`

---

### 3. **Absence de Tests Automatisés** ⚠️ CRITIQUE

**Problème** :
- **0 tests unitaires** dans le projet
- **0 tests d'intégration**
- Pas de CI/CD pour les tests
- Risque élevé de régression

**Solution recommandée** :
- Installer **Vitest** (déjà sur Vite)
- Créer tests pour :
  - `useTransactions.ts` (logique complexe)
  - `lib/validation.ts` (schémas)
  - Composants critiques (`TransactionForm.tsx`)
- Configurer GitHub Actions pour tests auto

---

## 📈 Métriques Techniques

| Métrique | Valeur |
|----------|--------|
| Métrique | Valeur |
|----------|--------|
| **Lignes de code** | ~60,000+ |
| **Composants** | 200+ |
| **Hooks** | 55+ |
| **Pages** | 55+ |
| **Edge Functions** | 20+ |
| **Tables DB** | 60+ |
| **Fichiers de migration** | 15+ |
| **Mockups haute fidélité** | 50+ |

---

## 🔗 Technologies Utilisées

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript |
| Build | Vite 6 |
| UI | Tailwind CSS + shadcn/ui + Glassmorphism |
| State | React Query (TanStack) |
| Backend | Supabase (PostgreSQL + Edge Functions Deno) |
| Auth | Supabase Auth + RBAC |
| Validation | Zod |
| Charts | Recharts |
| Forms | React Hook Form |
| PDF | Puppeteer / react-pdf |
| PWA | Service Worker (notifications push) |
| Paiements | Mobile Money (Airtel, Orange, M-Pesa) |
| Comptabilité | OHADA Plan Comptable

---

## 📝 Conventions de Code

- **Hooks** : `use[Nom]` (camelCase)
- **Composants** : `[Nom].tsx` (PascalCase)
- **Pages** : `[Nom].tsx` (PascalCase)
- **Services** : `[Nom].ts` (camelCase)
- **Types** : `I[Nom]` ou `[Nom]Type`

---

## 📦 Nouveaux Ajouts (Avril 2026)

### 1. Notification Hub (Phase 7)
- Composants : `NotificationCenter`, `NotificationCard`, `NotificationSettingsTab`
- Hook : `useNotifications.ts`
- Service Worker : `public/sw.js`, `public/manifest.json` (PWA)
- Service : `notificationService.ts`, `notificationSender.ts`
- Push subscriptions : `migrations/20260427000002_push_subscriptions_v1.sql`

### 2. Conformité DGI (Phase 3 - COD-21)
- API Proxy DGI avec rate limiting (`api-dgi-proxy/`, `api-dgi-submit/`, `api-dgi-validate/`)
- Edge Functions mock : `mock-dgi-status`, `mock-dgi-submit`, `mock-dgi-verify`
- Pages : `DgiStatus.tsx`, dashboard DGI
- Hook : `useDashboardDgi.ts`
- Service : `services/dgi.ts`
- Migration : `20260423000002_phase3_dgi_compliance.sql`

### 3. Authentification & Onboarding (Sprint 1)
- Pages : `Login.tsx`, `Register.tsx`, `Onboarding.tsx`, `SetupWizard.tsx`
- Composants : `ProtectedRouteEnhanced.tsx`, `withProtection.tsx`
- Migration : `20260424000000_phase1_foundations_auth.sql`

### 4. Devis & Suivi
- Pages : `Devis.tsx`, `Factures-View.tsx`
- Composants : `InvoicePaper.tsx`

### 5. Import CSV
- Composants : `CSVImporter.tsx`, `ClientsImporter.tsx`, `TransactionsImporter.tsx`, `import-report.tsx`

### 6. Mockups v2 (50+ écrans validés)
- Design System : Emerald glassmorphism (vert #10B981)
- Écrans : Dashboard, Factures, Clients, DGI, POS, Comptabilité OHADA, Mobile, Notifications, etc.

---

*Document généré le 11/02/2026 — Mis à jour Avril 2026*
