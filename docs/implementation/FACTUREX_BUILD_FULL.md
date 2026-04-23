# 🔧 Plan de Build Complet — FactureSmart
## 8 Sprints, 52 écrans, ~18 semaines

**Issue** : COD-25  
**Parent** : COD-22 (Phase 4 - Design Refactoring Complet)  
**Date** : 23 Avril 2026  
**Statut** : ✅ Plan complet — Prêt pour implémentation

---

## 📊 Vue d'ensemble

- **Maquettes** : 65 fichiers HTML dans `/home/jay/FactureSmart/mockups-v2/`
- **Écrans fonctionnels** : ~52
- **Stack** : React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase
- **Durée estimée** : ~18 semaines (1 dev) / ~10 semaines (2 devs)

---

## ⚠️ Constat architecture

Le codebase actuel (CoxiPay v1.0.3) a ~50K lignes pour transferts USD/CDF.
Le nouveau spec FactureSmart demande : **facturation DGI, OHADA, POS, SaaS, Mobile Money**.
**→ Refonte majeure du data model, pas simple ajout de modules.**

---

## 🗺️ Sprints & Modules

### Sprint 1 — Auth + Onboarding
**Durée** : 2 semaines | **Écrans** : 14

| Fichier | Description |
|---------|-------------|
| `screen-00-login.html` | Login (email/NIF + OAuth Google/Microsoft) |
| `screen-B-inscription.html` | Inscription étape 1 |
| `screen-B2-inscription-company.html` | Inscription étape 2 |
| `screen-B3-inscription-nif.html` | Inscription étape 3 |
| `screen-B4-inscription-verify.html` | Vérification NIF DGI |
| `screen-A1-onboarding.html` | Welcome + slides |
| `screen-A2-onboarding-create.html` | Slide création facture |
| `screen-A3-onboarding-dgi.html` | Slide transmission DGI |
| `screen-A4-onboarding-complete.html` | Completion |
| `screen-A5-setup-wizard.html` | Setup wizard entreprise |
| `screen-B6-onboarding-post.html` | Post-onboarding |
| `screen-E-roles.html` | RBAC admin |
| `screen-E3-user-edit.html` | Edit user |
| `screen-E6-user-invite.html` | Invitation email |

**Backend** :
- Tables : `companies`, `users`, `nif_verification`, `user_invitations`
- Auth : Supabase + OAuth Google/Microsoft
- Edge Function : `verify-nif-dgi`
- Endpoint : `POST /api/company/setup`
- Endpoint : `POST /api/users/invite`

---

### Sprint 2 — Core Facturation + DGI
**Durée** : 3 semaines | **Écrans** : 9 | **Complexité** : HAUTE

| Fichier | Description |
|---------|-------------|
| `screen-01-dashboard.html` | Dashboard avec aggregations |
| `screen-02-factures.html` | Liste factures + filtres |
| `screen-03-creation-facture.html` | Création facture |
| `screen-03b-facture-detail.html` | Détail facture |
| `screen-04-preview-facture.html` | Preview PDF |
| `screen-05-dgi-status.html` | Statut transmission DGI |
| `screen-09-devis.html` | Gestion devis |
| `screen-J2-invoice-detail-full.html` | Vue plein écran |
| `screen-J3-invoice-history.html` | Timeline modifications |

**Backend** :
- Tables : `invoices`, `invoice_lines`, `quotes`, `dgi_transmissions`, `facture_history`
- PDF : jsPDF + html2canvas (côté client)
- DGI : Webhook + Edge Function `dgi-transmission`
- Calculs auto : HT / TVA / TTC

---

### Sprint 3 — Clients + Catalogue
**Durée** : 1.5 semaines | **Écrans** : 3

| Fichier | Description |
|---------|-------------|
| `screen-06-clients.html` | Liste clients + recherche |
| `screen-J1-client-detail.html` | Fiche client détaillée |
| Settings catalogue | Table `products`, `categories` |

**Backend** :
- Tables : `clients`, `products`, `product_categories`
- Recherche full-text
- Stats client (total factures, impayés)

---

### Sprint 4 — POS + Caisse
**Durée** : 3 semaines | **Écrans** : 11 | **Complexité** : HAUTE

| Fichier | Description |
|---------|-------------|
| `screen-G-pos.html` | Configuration POS |
| `screen-G1-pos-caisse.html` | Interface caisse temps réel |
| `screen-G2-pos-catalogue.html` | Catalogue produits POS |
| `screen-G3-pos-checkout.html` | Paiement + rendu monnaie |
| `screen-G4-pos-settings.html` | Paramètres imprimante |
| `screen-G5-pos-recu.html` | Génération ticket 80mm |
| `screen-G6-pos-historique.html` | Historique ventes POS |
| `screen-L1-ouverture-caisse.html` | Ouverture caisse |
| `screen-L2-journal-caisse.html` | Journal mouvements |
| `screen-L3-fermeture-caisse.html` | Clôture + écart |
| `screen-L4-transfert-caisse-banque.html` | Transfert caisse→banque |

**Backend** :
- Tables : `pos_sales`, `pos_sale_items`, `cash_register_sessions`, `cash_movements`
- État local (Zustand ou React Query cache)
- Impression : générer HTML → impression directe
- Paiement multi-modes (Liquid cash, Mobile Money)

---

### Sprint 5 — Comptabilité OHADA
**Durée** : 4 semaines | **Écrans** : 9 | **Complexité** : TRÈS HAUTE

| Fichier | Description |
|---------|-------------|
| `screen-K1-plan-comptable.html` | Plan comptable SYSCOHADA |
| `screen-K2-journal.html` | Journal des écritures |
| `screen-K3-grand-livre.html` | Grand livre par compte |
| `screen-K4-balance.html` | Balance périodique |
| `screen-K5-compte-resultat.html` | Compte de résultat |
| `screen-K6-bilan.html` | Bilan Actif/Passif |
| `screen-K7-tresorerie.html` | Suivi trésorerie |
| `screen-K8-releve-bancaire.html` | Import + rapprochement |
| `screen-K9-ohada-export.html` | Export XML/PDF SYSCOHADA |

**Backend** :
- Table : `chart_of_accounts` (SYSCOHADA — 1000+ comptes)
- Tables : `accounting_entries`, `accounting_journals`, `bank_statements`, `reconciliations`
- Edge Functions : `generate-syscohada-xml`, `generate-bilan-pdf`
- Calculs OHADA : résultat net, bilan, balance

---

### Sprint 6 — Rapports + Paramètres
**Durée** : 2.5 semaines | **Écrans** : 11

| Fichier | Description |
|---------|-------------|
| `screen-07-rapports.html` | Rapports TVA + graphiques |
| `screen-08-settings.html` | Paramètres complets |
| `screen-E-roles.html` | Gestion rôles |
| `screen-E3-user-edit.html` | Edit user |
| `screen-E6-user-invite.html` | Invite user |
| `screen-J4-settings-notifications.html` | Préférences notifs |
| `screen-J5-settings-integrations.html` | Clés API |
| `screen-J6-settings-security.html` | 2FA + sessions |
| `screen-J7-settings-export-advanced.html` | Export avancé |
| `screen-F-abonnement.html` | Plans SaaS |
| `screen-F4-payment-card.html` | Paiement carte |

**Backend** :
- Tables : `subscriptions`, `subscription_plans`, `subscription_payments`
- Tables : `api_keys`, `user_sessions`
- OAuth : Google/Microsoft 2FA
- Export : CSV, XLSX, PDF

---

### Sprint 7 — Mobile + Modales
**Durée** : 2 semaines | **Écrans** : 7

| Fichier | Description |
|---------|-------------|
| `screen-H-mobile.html` | Dashboard mobile |
| `screen-H4-invoice-list-mobile.html` | Liste factures mobile |
| `screen-H6-invoice-detail-mobile.html` | Détail facture mobile |
| `screen-H7-notification-center-mobile.html` | Centre notifs mobile |
| `screen-C-modales.html` | 12 modales réutilisées |
| `screen-C13-modal-edit-line.html` | Modal edit ligne |
| `screen-C14-modal-rapport.html` | Modal génération rapport |
| `screen-D-notifications.html` | Système notifications |
| `screen-D4-mobile-notifications.html` | Notifications push |

**Backend** :
- PWA : Service Worker + manifest
- Push : FCM ou Supabase Realtime
- Tables : `notifications`, `push_subscriptions`

---

### Sprint 8 — Landing Page
**Durée** : 0.5 semaine | **Écrans** : 1

| Fichier | Description |
|---------|-------------|
| `landing.html` | Site vitrine |

**Notes** : Static HTML ou Next.js. Pas de backend.

---

## 🔢 Résumé sprints

| Sprint | Durée | Complexité | Points bloquants |
|--------|-------|------------|-----------------|
| 1 — Auth + Onboarding | 2 sem | Moyenne | OAuth |
| 2 — Facturation + DGI | 3 sem | Haute | API DGI réelle |
| 3 — Clients + Catalogue | 1.5 sem | Faible | — |
| 4 — POS + Caisse | 3 sem | Haute | Impression thermal |
| 5 — OHADA | 4 sem | Très haute | Plan SYSCOHADA |
| 6 — Rapports + Params | 2.5 sem | Moyenne | OAuth, Stripe |
| 7 — Mobile + Modales | 2 sem | Moyenne | FCM |
| 8 — Landing | 0.5 sem | Faible | — |
| **TOTAL** | **~18 sem** | | |

---

## 🔴 Points critiques à résoudre

1. **API DGI** — Credentials sandbox + production pour Sprint 2
2. **Mobile Money** — Accès merchant M-Pesa / Orange / Airtel
3. **Branding** — Décision nom + création constantes `APP_NAME`
4. **Schema DB** — Migration CoxiPay → FactureSmart (reset ou migration ?)
5. **SYSCOHADA** — Source officielle du plan comptable (1000+ comptes)

---

## ✅ Livrables par sprint

1. Components React dans `src/components/`
2. Pages dans `src/pages/`
3. Routes dans `App.tsx`
4. Tables PostgreSQL avec RLS
5. Edge Functions déployées
6. Tests : >70% coverage backend
7. Documentation README mise à jour

---

*Document généré : 23 Avril 2026*
