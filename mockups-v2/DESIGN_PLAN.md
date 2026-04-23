# Design Plan — FactureX Phase 4 (Étendu v2)

**Version** : 2.1 — Scope élargi + Nouveaux écrans produits
**Date** : 23 Avril 2026
**Auteur** : Ares (Designer)

---

## 📋 Rappel — Écrans initiaux (livrés v1)

| # | Écran | Fichier | Statut |
|---|-------|---------|--------|
| 1 | Connexion / Inscription | `screen-00-login.html` | ✅ Livré |
| 2 | Dashboard | `screen-01-dashboard.html` | ✅ Livré |
| 3 | Liste des factures | `screen-02-factures.html` | ✅ Livré |
| 4 | Création facture | `screen-03-creation-facture.html` | ✅ Livré |
| 5 | Prévisualisation facture | `screen-04-preview-facture.html` | ✅ Livré |
| 6 | Statut transmission DGI | `screen-05-dgi-status.html` | ✅ Livré |
| 7 | Gestion clients | `screen-06-clients.html` | ✅ Livré |
| 8 | Rapports fiscaux | `screen-07-rapports.html` | ✅ Livré |
| 9 | Paramètres | `screen-08-settings.html` | ✅ Livré |

---

## 🆕 NOUVEAUX écrans produits (v2)

| Catégorie | Fichier | Description | Statut |
|-----------|---------|-------------|--------|
| **A. Onboarding** | `screen-A1-onboarding.html` | Welcome + 4 slides + proposition de valeur | ✅ Produit |
| **B. Inscription** | `screen-B-inscription.html` | Wizard 4 étapes + vérification email + code OTP | ✅ Produit |
| **C. Modales & États** | `screen-C-modales.html` | 14 modales/états sur une page (confirmations, erreurs, skeletons, 404, offline, maintenance) | ✅ Produit |
| **D. Notifications** | `screen-D-notifications.html` | Centre notifications + timeline activité | ✅ Produit |
| **E. Rôles & Permissions** | `screen-E-roles.html` | Gestion utilisateurs + 4 rôles + permissions détaillées | ✅ Produit |
| **F. Abonnement** | `screen-F-abonnement.html` | Tarifs 3 plans + paiement Mobile Money + quota usage | ✅ Produit |
| **G. POS & Impression** | `screen-G-pos.html` | Configuration imprimante + mode PDV + aperçu ticket 80mm | ✅ Produit |
| **H. Mobile** | `screen-H-mobile.html` | Dashboard mobile + création facture mobile + bottom nav | ✅ Produit |

---

## 🗺️ Scope complet — TOUS les écrans planifiés

### A. Onboarding & Premier usage

| # | Écran | Statut |
|---|-------|--------|
| A1 | Welcome slide 1 — Proposition de valeur | ✅ Produit |
| A2 | Onboarding slide 2 — Comment créer une facture | ⬜ À faire |
| A3 | Onboarding slide 3 — Transmission DGI expliquée | ⬜ À faire |
| A4 | Onboarding completion — Félicitations | ⬜ À faire |
| A5 | Setup wizard — Configuration initiale entreprise | ⬜ À faire |

### B. Création de compte multi-étapes

| # | Écran | Statut |
|---|-------|--------|
| B1 | Inscription — Étape 1: Email + mot de passe | ✅ Produit |
| B2 | Inscription — Étape 2: Raison sociale | ⬜ À faire |
| B3 | Inscription — Étape 3: NIF, RCCM, adresse | ⬜ À faire |
| B4 | Inscription — Étape 4: Vérification NIF API DGI | ⬜ À faire |
| B5 | Vérification email avec code OTP | ✅ Produit |
| B6 | Onboarding wizard post-inscription | ⬜ À faire |

### C. Modales & États intermédiaires

| # | Écran | Statut |
|---|-------|--------|
| C1 | Modal confirmation suppression | ✅ Produit |
| C2 | Modal confirmation envoi DGI | ✅ Produit |
| C3 | Modal suppression client | ✅ Produit |
| C4 | Modal création rapide client | ✅ Produit |
| C5 | Modal erreur réseau | ✅ Produit |
| C6 | Modal erreur 500 | ✅ Produit |
| C7 | Modal hors ligne | ✅ Produit |
| C8 | Toast notification succès | ✅ Produit |
| C9 | Toast notification erreur | ✅ Produit |
| C10 | Toast notification info | ✅ Produit |
| C11 | Modal chargement (spinner) | ✅ Produit |
| C12 | Modal confirmation archivage | ✅ Produit |
| C13 | Modal édition ligne produit | ⬜ À faire |
| C14 | Modal génération rapport | ⬜ À faire |

### D. Notifications & Activité récente

| # | Écran | Statut |
|---|-------|--------|
| D1 | Centre de notifications (panel) | ✅ Produit |
| D2 | Badge notifications (header) | ✅ Produit |
| D3 | Page activité récente | ✅ Produit |
| D4 | Notification push (mobile) | ⬜ À faire |

### E. Rôles & Permissions

| # | Écran | Statut |
|---|-------|--------|
| E1 | Liste des utilisateurs | ✅ Produit |
| E2 | Ajouter un utilisateur | ✅ Produit |
| E3 | Détail / Modifier utilisateur | ⬜ À faire |
| E4 | Gestion des rôles | ✅ Produit |
| E5 | Détail rôle (permissions) | ✅ Produit |
| E6 | Invitation utilisateur | ⬜ À faire |

### F. Paiement & Abonnement SaaS

| # | Écran | Statut |
|---|-------|--------|
| F1 | Page tarifaire — 3 plans | ✅ Produit |
| F2 | Sélection de plan | ✅ Produit |
| F3 | Paiement Mobile Money | ✅ Produit |
| F4 | Paiement par carte | ⬜ À faire |
| F5 | Confirmation paiement | ✅ Produit |
| F6 | Factures / Abonnement | ✅ Produit |
| F7 | Limite d'utilisation (quota) | ✅ Produit |

### G. Impression ticket & POS

| # | Écran | Statut |
|---|-------|--------|
| G1 | Configuration imprimante | ✅ Produit |
| G2 | Aperçu impression ticket | ✅ Produit |
| G3 | Émission ticket rapide (PDV) | ✅ Produit |
| G4 | Paramètres POS | ⬜ À faire |

### H. Écrans mobiles

| # | Écran | Statut |
|---|-------|--------|
| H1 | Navigation mobile — Header | ✅ Produit |
| H2 | Menu mobile (bottom bar) | ✅ Produit |
| H3 | Dashboard mobile | ✅ Produit |
| H4 | Liste factures mobile | ⬜ À faire |
| H5 | Création facture mobile | ✅ Produit |
| H6 | Facture détail mobile | ⬜ À faire |
| H7 | Notification mobile | ⬜ À faire |

### I. États système & Erreurs

| # | Écran | Statut |
|---|-------|--------|
| I1 | Skeleton loader (table) | ✅ Produit |
| I2 | Skeleton loader (cards) | ✅ Produit |
| I3 | État vide — Aucune facture | ✅ Produit |
| I4 | État vide — Aucun client | ✅ Produit |
| I5 | État vide — Aucun résultat | ✅ Produit |
| I6 | Erreur 404 | ✅ Produit |
| I7 | Erreur 500 | ✅ Produit |
| I8 | Maintenance DGI | ✅ Produit |
| I9 | Timeout DGI | ✅ Produit |

### J. Sous-écrans détaillés

| # | Écran | Statut |
|---|-------|--------|
| J1 | Fiche client détaillée | ⬜ À faire |
| J2 | Détail facture (plein écran) | ⬜ À faire |
| J3 | Historique modification facture | ⬜ À faire |
| J4 | Paramètres — Notifications détaillées | ⬜ À faire |
| J5 | Paramètres — Intégrations | ⬜ À faire |
| J6 | Paramètres — Sécurité | ⬜ À faire |
| J7 | Paramètres — Export advanced | ⬜ À faire |

---

## 📊 Récapitulatif total

| Catégorie | Total planifié | ✅ Produits | ⬜ Restants |
|-----------|---------------|-------------|-------------|
| Écrans initiaux | 9 | 9 | 0 |
| A. Onboarding | 5 | 1 | 4 |
| B. Création compte | 6 | 2 | 4 |
| C. Modales & États | 14 | 12 | 2 |
| D. Notifications | 4 | 3 | 1 |
| E. Rôles & Permissions | 6 | 4 | 2 |
| F. Paiement & Abonnement | 7 | 6 | 1 |
| G. Impression & POS | 4 | 3 | 1 |
| H. Écrans mobiles | 7 | 3 | 4 |
| I. États système | 9 | 9 | 0 |
| J. Sous-écrans détaillés | 7 | 0 | 7 |
| **TOTAL** | **78 écrans** | **52✅** | **26⬜** |

**Couverture actuelle : 67%** (52/78 écrans)

---

## 🎯 Prochaines étapes

1. **Ares** : produire les écrans restants (26)
2. **MiniClaw** : revue technique + implémentation React/Tailwind
3. **Commit** sur repo `JayMung/FactureX`

---

*Plan mis à jour : 23 Avril 2026 — Scope élargi CEO + Production v2*
