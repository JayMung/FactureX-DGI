# Guide Utilisateur — FactureSmart

> **Version :** v2.0 | **Dernière mise à jour :** Juin 2024

---

## Table des Matières

1. [Démarrage Rapide](#1-démarrage-rapide)
2. [Tableau de Bord](#2-tableau-de-bord)
3. [Clients](#3-clients)
4. [Transactions](#4-transactions)
5. [Factures & Devis](#5-factures--devis)
6. [Conformité DGI](#6-conformité-dgi)
7. [Articles & Stock](#7-articles--stock)
8. [Caisse POS](#8-caisse-pos)
9. [Colis & Expéditions](#9-colis--expéditions)
10. [Comptabilité SYSCOHADA](#10-comptabilité-syscohada)
11. [Rapports](#11-rapports)
12. [Paramètres](#12-paramètres)
13. [Dépannage](#13-dépannage)

---

## 1. Démarrage Rapide

### 1.1 Créer votre compte

1. Rendez-vous sur [FactureSmart](https://facturesmart.com)
2. Cliquez sur **Créer un compte**
3. Renseignez : nom, email, téléphone, mot de passe
4. Configurez votre organisation : nom, NIF, adresse, devise par défaut
5. ✅ Terminé — vous êtes redirigé vers le tableau de bord

### 1.2 Premiers pas

| Étape | Action | Où |
|-------|--------|-----|
| 1 | Ajoutez votre premier client | Menu **Clients** |
| 2 | Créez votre première transaction | Menu **Transactions** |
| 3 | Générez une facture | Menu **Factures** |
| 4 | Explorez les rapports | Menu **Rapports** |

### 1.3 Structure de navigation

```
┌─────────────────────────────────────────────────┐
│  Dashboard  │  Clients  │  Transactions  │  ...  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Contenu principal de la page active            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 2. Tableau de Bord

Le dashboard vous donne une vue d'ensemble de votre activité.

### Indicateurs Clés

- **Revenu total** (USD / CDF) — Somme des transactions validées
- **Transactions** — Nombre total sur la période
- **Clients actifs** — Clients avec transactions récentes
- **Évolution** — Variation en pourcentage vs période précédente

### Graphiques

- **Évolution des revenus** — Courbe jour/semaine/mois
- **Répartition des transactions** — Par type (revenus, dépenses, etc.)
- **Top clients** — Clients générant le plus de revenus

### Périodes

| Période | Description |
|---------|-------------|
| 7 jours | Vue courte |
| 30 jours | Vue mensuelle (défaut) |
| 90 jours | Vue trimestrielle |
| 1 an | Vue annuelle |
| Personnalisée | Dates libre |

---

## 3. Clients

### 3.1 Ajouter un client

1. Allez dans **Clients → Nouveau client**
2. Renseignez les informations :
   - **Nom** (obligatoire)
   - **Téléphone** (obligatoire pour Mobile Money)
   - **Email** (pour envoi de factures)
   - **Adresse** — Rue, Ville, Province
   - **NIF** (si client professionnel)
3. Cliquez sur **Enregistrer**

### 3.2 Gérer les clients

- **Recherche** — Par nom, téléphone ou email
- **Filtres** — Par ville, date d'ajout
- **Tri** — Nom, total payé, dernière transaction
- **Export** — CSV des données clients

### 3.3 Vue détail client

- Informations de contact
- Historique des transactions
- Factures associées
- Statistiques : total payé, nombre de transactions
- Tendance : évolution des achats

---

## 4. Transactions

### 4.1 Types de transactions

| Type | Description | Exemples |
|------|-------------|----------|
| **Revenu** | Argent entrant | Vente de produits, services |
| **Dépense** | Argent sortant | Achats, frais, salaires |
| **Transfert** | Mouvement interne | Caisse → Banque, caisse → caisse |
| **Caisse** | Lier à une session POS | Transactions de vente au comptoir |

### 4.2 Créer une transaction

1. Allez dans **Transactions → Nouvelle transaction**
2. Sélectionnez le **type**
3. Renseignez :
   - **Montant** — En USD ou CDF
   - **Client** — Recherche ou sélection
   - **Motif** — Description de la transaction
   - **Mode de paiement** — Espèces, Mobile Money, Carte, Virement
   - **Date** — Date de l'opération
4. Cliquez sur **Enregistrer**

### 4.3 Modes de paiement

| Mode | Description |
|------|-------------|
| **Espèces** | Paiement en cash |
| **Mobile Money** | M-Pesa, Airtel Money, Orange Money |
| **Carte** | Visa, Mastercard |
| **Virement** | Virement bancaire |
| **Mixte** | Combinaison de plusieurs modes |

### 4.4 Calcul automatique

```
Montant saisi : 10 000 CDF
Frais (5%)     :   500 CDF
───────────────
Net perçu      : 9 500 CDF
```

### 4.5 Filtres avancés

Accédez à l'historique complet avec :
- Filtre par statut (Servi, Annulé, En attente)
- Filtre par devise (USD, CDF)
- Filtre par mode de paiement
- Filtre par date (début/fin)
- Filtre par montant (min/max)
- Recherche textuelle dans le motif

---

## 5. Factures & Devis

### 5.1 Types de documents

| Document | Icône | Usage |
|----------|-------|-------|
| **Facture** | 📄 | Vente de biens ou services |
| **Devis** | 📋 | Proposition commerciale avant vente |
| **Avoir** | ↩️ | Note de crédit (retour marchandise) |
| **Annulation** | 🚫 | Annulation d'une facture émise |
| **Facture d'acompte** | 💰 | Paiement anticipé / avance |

### 5.2 Créer une facture

1. Allez dans **Factures → Nouvelle facture**
2. Sélectionnez le **type de document**
3. Renseignez :
   - **Client** — Recherche ou nouveau
   - **Articles** — Sélection depuis le stock (ou saisie libre)
   - **TVA** — Groupe A (0%), B (8%) ou C (16%) par article
   - **Remise** — Optionnelle, en % ou montant
4. Aperçu avec TVA calculée automatiquement
5. Cliquez sur **Créer**

### 5.3 Exemple de calcul TVA

```
Article : Chaise en bois
Quantité : 2
Prix unitaire HT : 5 000 CDF
Total HT : 10 000 CDF
TVA Groupe C (16%) : 1 600 CDF
───────────────
Total TTC : 11 600 CDF
```

### 5.4 Statuts des factures

| Statut | Description |
|--------|-------------|
| **Brouillon** | En cours d'édition, non finalisée |
| **Validée** | Finalisée, en attente de paiement |
| **Envoyée** | Transmise au client |
| **Payée** | Marquée comme payée |
| **Annulée** | Annulée |

### 5.5 Envoyer une facture

- **Email** — Envoi direct depuis l'application
- **WhatsApp** — Partage via lien ou PDF
- **Téléchargement PDF** — Impression papier
- **Lien partageable** — Le client consulte en ligne

### 5.6 Devis → Facture

Un devis accepté peut être converti en facture en un clic. Les données client et articles sont préservées.

---

## 6. Conformité DGI

### 6.1 Prérequis

- **NIF** actif (Numéro d'Identification Fiscale)
- **DGI_API_KEY** configurée dans les paramètres (obtenue via le portail DGI RDC)
- **Entreprise assujettie à la TVA** (groupe A, B ou C)

### 6.2 Déclarants

Gérez les déclarants autorisés à soumettre à la DGI :

1. Allez dans **Paramètres → DGI**
2. Ajoutez un déclarant :
   - **Nom** du déclarant
   - **NIF** du déclarant
   - **Email** (optionnel)
3. Activez/désactivez les déclarants

### 6.3 Déclarations TVA Mensuelles

1. Sélectionnez la **période** (mois et année)
2. Vérifiez les totaux calculés :
   - TVA collectée (ventes avec TVA)
   - TVA déductible (achats avec TVA)
   - Net à payer ou crédit de TVA
3. Ajoutez les **pièces justificatives** (facultatif)
4. Générez le **rapport DGI**
5. Soumettez via le portail DGI intégré

### 6.4 Soumission DGI (par facture)

Pour qu'une facture soit conforme DGI :

1. Créez une facture avec les **articles et TVA** corrects
2. Validez la facture
3. Cliquez sur **Soumettre à la DGI**
4. Le système génère :
   - **Numéro DGI** — Format : `AAMM-NNNNNNNN`
   - **Code d'autorisation** — À 16 caractères
   - **QR code** — Pour validation client
5. ✅ Conforme DGI

### 6.5 Validation de facture DGI

Les clients peuvent valider vos factures DGI :

- **Scan QR code** — Via l'appli mobile DGI
- **Saisie manuelle** — Numéro DGI + Code d'autorisation
- **Statut** — Valide / Invalide / Non trouvé

### 6.6 Types DGI RDC

| Code | Type | Description |
|------|------|-------------|
| **FV** | Facture de Vente | Standard |
| **EV** | Facture d'Avoir | Note de crédit |
| **FT** | Facture de Travail | Prestation de services |
| **FA** | Facture d'Acompte | Avance / acompte |
| **ET** | Export Tax | Export (hors TVA) |
| **EA** | Encaissement Anticipé | Reçu d'encaissement |

---

## 7. Articles & Stock

### 7.1 Ajouter un article

1. Allez dans **Articles → Nouvel article**
2. Renseignez :
   - **Nom** — Désignation de l'article
   - **Prix unitaire** — HT
   - **TVA** — Groupe A, B ou C
   - **Code-barres** — Optionnel (scan)
   - **Stock initial** — Quantité en inventaire
   - **Catégorie** — Classification
   - **Description** — Facultatif

### 7.2 Gérer le stock

- **Entrées de stock** — Approvisionnement, réceptions
- **Sorties de stock** — Ventes, ajustements
- **Stock minimum** — Alerte quand le seuil est atteint
- **Inventaire** — Ajustement périodique

### 7.3 Catégories

Organisez vos articles par catégories pour une navigation plus rapide.

---

## 8. Caisse POS

### 8.1 Sessions de caisse

Les sessions permettent de suivre les entrées et sorties d'une caisse physique sur une période donnée.

#### Ouvrir une session

1. Allez dans **Caisse → Nouvelle session**
2. Saisissez le **solde d'ouverture**
3. Note : *Date, numéro de caisse, caissier*

#### Clôturer une session

1. Allez dans la session active
2. Cliquez sur **Clôturer la session**
3. Renseignez le **solde de clôture** (comptage physique)
4. L'écart (théorique vs réel) est calculé automatiquement
5. Le rapport de clôture est généré : ticket Z détaillé

### 8.2 Tickets de vente (POS)

1. Ouvrez une **session de caisse**
2. Cliquez sur **Nouveau ticket**
3. Ajoutez les articles : scan code-barres ou recherche
4. Sélectionnez le mode de paiement
5. Imprimez le ticket

### 8.3 Clôtures X et Z

| Type | Action | Usage |
|------|--------|-------|
| **X** | Rapport intermédiaire | En cours de session, pas de clôture |
| **Z** | Rapport final | À la clôture, réinitialise les compteurs |

Contenu des rapports :
- Total des ventes par mode de paiement
- Nombre de tickets
- TVA collectée
- Écarts de caisse
- Articles les plus vendus

### 8.4 Transfert de caisse

Transférez de l'argent entre caisses :
- Caisse A → Caisse B
- Enregistrement comptable automatique
- Traçabilité complète

---

## 9. Colis & Expéditions

### 9.1 Ajouter un colis

1. Allez dans **Colis → Nouveau colis**
2. Renseignez :
   - **Client** — Destinataire
   - **Description** — Contenu
   - **Poids** — En kg
   - **Transporteur** — Buckydrop, autre
   - **Origine** — Ville de départ
   - **Destination** — Ville d'arrivée
   - **Tracking** — Numéro de suivi

### 9.2 Suivi

- **Tableau de suivi** — Statut, date, lieu
- **Notifications** — Changements de statut
- **Historique** — Toutes les étapes du transport
- **Notification client** — Email ou SMS

### 9.3 Statuts

| Statut | Description |
|--------|-------------|
| En attente | Pas encore expédié |
| En transit | En cours d'acheminement |
| Arrivé | Arrivé à destination |
| Livré | Remis au client |
| Annulé | Expédition annulée |

---

## 10. Comptabilité SYSCOHADA

### 10.1 Plan Comptable

Respect du plan comptable SYSCOHADA (OHADA) :
- **Classe 1** — Comptes de ressources durables
- **Classe 2** — Comptes d'actif immobilisé
- **Classe 3** — Comptes de stocks
- **Classe 4** — Comptes de tiers
- **Classe 5** — Comptes de trésorerie
- **Classe 6** — Comptes de charges
- **Classe 7** — Comptes de produits
- **Classe 8** — Comptes de résultats spéciaux

### 10.2 Journaux

| Journal | Code | Transactions |
|---------|------|-------------|
| **Ventes** | `VTE` | Factures de vente |
| **Achats** | `ACH` | Achats et approvisionnements |
| **Banque** | `BNQ` | Opérations bancaires |
| **Caisse** | `CSE` | Opérations d'espèces |
| **OD** | `OD` | Opérations diverses |

### 10.3 Écriture Comptable

Pour chaque transaction, une écriture est automatiquement générée :
- **Débit** : Compte de charge (classe 6) ou d'actif
- **Crédit** : Compte de trésorerie (classe 5) ou de produit (classe 7)

### 10.4 Grand Livre

Vue complète de tous les mouvements par compte :
- Période sélectionnable
- Solde débiteur / créditeur
- Report à nouveau

### 10.5 Balance

- Balance générale (tous comptes)
- Balance auxiliaire (par client / fournisseur)
- Totaux débiteurs = Totaux créditeurs

### 10.6 États Financiers (Clôture)

Documents générés :
- **Bilan** (Actif / Passif)
- **Compte de Résultat** (Charges / Produits)
- **TVA** — États mensuels

### 10.7 Export OHADA

| Format | Description |
|--------|-------------|
| **K7** | Balance générale |
| **K8** | Grand livre |
| **K9** | Journal |

---

## 11. Rapports

### 11.1 Rapports disponibles

| Rapport | Description | Usage |
|---------|-------------|-------|
| **Dashboard** | Vue d'ensemble | Quotidien |
| **Ventes** | Analyse des ventes par période | Hebdomadaire |
| **Clients** | Comportement et fidélité | Mensuel |
| **Transactions** | Détail par type | Hebdomadaire |
| **TVA** | États TVA (DGI) | Mensuel |
| **Caisse** | Rapport X/Z | Quotidien |
| **Bénéfices** | Revenus - Frais | Mensuel |

### 11.2 Exporter un rapport

1. Ouvrez le rapport souhaité
2. Ajustez les filtres (période, devise, etc.)
3. Cliquez sur **Exporter**
4. Format : **CSV**, **PDF** (selon le rapport)

### 11.3 Filtres communs

- **Période** — 7j, 30j, 90j, 1 an, personnalisée
- **Devise** — USD / CDF
- **Type** — Revenu / Dépense
- **Client** — Un client spécifique

---

## 12. Paramètres

### 12.1 Organisation

| Champ | Description |
|-------|-------------|
| Nom | Nom de l'entreprise |
| NIF | Numéro d'Identification Fiscale |
| Adresse | Rue, Ville, Province |
| Email | Contact principal |
| Site web | URL du site |
| Logo | Image (format carré recommandé) |
| Devise par défaut | USD ou CDF |

### 12.2 Préférences de facturation

- **Numérotation automatique** — Préfixe, séquence
- **Délai de paiement** — Net 30, Net 60, etc.
- **Mentions légales** — Texte personnalisé sur les factures
- **Pied de page** — Informations bancaires, etc.

### 12.3 Gestion de l'équipe

| Rôle | Permissions |
|------|-------------|
| **Admin** | Accès complet, paramètres, équipe |
| **Comptable** | Transactions, factures, rapports |
| **Caissier** | Caisse POS uniquement |
| **Commercial** | Clients, devis |

#### Inviter un membre

1. Allez dans **Paramètres → Équipe**
2. Cliquez sur **Inviter**
3. Renseignez : email, rôle
4. Le membre reçoit un email d'invitation avec lien
5. L'invitation expire après 48h

### 12.4 API & Webhooks

Voir [Référence API complète](../api/API_MASTER.md) pour :
- **Générer des clés API** (Public, Secret, Admin)
- **Configurer des webhooks** (JSON, Discord, Slack, Telegram)
- **Intégrations** (n8n, scripts, etc.)

#### Créer une clé API

1. **Paramètres → API**
2. **Générer une clé**
3. Choisissez le type et les permissions
4. **Copiez la clé immédiatement** — elle ne sera plus affichée

### 12.5 Paramètres DGI

- **DGI_API_KEY** — Clé d'accès à l'API DGI RDC
- **Déclarants** — Gestion des personnes autorisées
- **NIF par défaut** — NIF de l'organisation

### 12.6 Import/Export

| Fonction | Description |
|----------|-------------|
| Import clients | CSV (nom, téléphone, email, ville) |
| Import articles | CSV (nom, prix, TVA, stock) |
| Export transactions | CSV ou PDF |
| Export factures | CSV ou PDF |
| Export comptable | K7, K8, K9 |

---

## 13. Dépannage

### 13.1 Problèmes courants

#### La page ne charge pas

1. Vérifiez votre connexion internet
2. Videz le cache navigateur (Ctrl+F5)
3. Essayez un autre navigateur
4. Vérifiez le statut sur [status.facturesmart.com](https://status.facturesmart.com)

#### Erreur API « 401 Unauthorized »

1. Vérifiez que votre clé API est correcte
2. Assurez-vous que la clé n'a pas expiré
3. Vérifiez vos permissions (scope)
4. Générez une nouvelle clé si nécessaire

#### Une facture DGI est bloquée

1. Vérifiez que le NIF est actif
2. Vérifiez que tous les articles ont un groupe TVA
3. Vérifiez que DGI_API_KEY est configurée
4. Tentez une resoumission avec `force_resubmit`

#### Écart de caisse

1. Clôturez la session et notez l'écart
2. Vérifiez le comptage physique
3. Consultez l'historique des tickets
4. Ajustez en cas d'erreur de saisie

### 13.2 Support

- **Email** : support@facturesmart.com
- **Documentation** : [docs.facturesmart.com](https://docs.facturesmart.com)
- **Statut** : [status.facturesmart.com](https://status.facturesmart.com)

### 13.3 Sécurité

- 🔒 Connexion HTTPS obligatoire
- 🔑 Clés API hashées en base de données
- 📧 Webhooks signés HMAC-SHA256
- 🛡️ Rate limiting par clé API
- 👥 Contrôle d'accès par rôle

---

*Guide utilisateur FactureSmart v2.0. Documenté avec ❤️ pour les entrepreneurs congolais.*
