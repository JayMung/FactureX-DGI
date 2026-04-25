# API Master Reference — FactureSmart

> **Version :** v1.0 | **Format :** REST | **Base URL :** `https://ddnxtuhswmewoxrwswzg.supabase.co/functions/v1`

---

## Table des Matières

1. [Authentification](#1-authentification)
2. [Headers & Format](#2-headers--format)
3. [Pagination](#3-pagination)
4. [Gestion des Erreurs](#4-gestion-des-erreurs)
5. [Endpoints](#5-endpoints)
   - [5.1 Transactions — `/api-transactions`](#51-transactions---api-transactions)
   - [5.2 Clients — `/api-clients`](#52-clients---api-clients)
   - [5.3 Factures & Devis — `/api-factures`](#53-factures--devis---api-factures)
   - [5.4 Statistiques — `/api-stats`](#54-statistiques---api-stats)
   - [5.5 DGI Proxy — `/api-dgi-proxy`](#55-dgi-proxy---api-dgi-proxy)
   - [5.6 DGI Submit — `/api-dgi-submit`](#56-dgi-submit---api-dgi-submit)
   - [5.7 DGI Validate — `/api-dgi-validate`](#57-dgi-validate---api-dgi-validate)
   - [5.8 Webhooks — `/api-webhooks`](#58-webhooks---api-webhooks)
   - [5.9 Colis — `/api-colis`](#59-colis---api-colis)
   - [5.10 Email — `/api-email-send`](#510-email---api-email-send)
   - [5.11 Telegram — `/api-telegram-send`](#511-telegram---api-telegram-send)
   - [5.12 Team Invite — `/api-team-invite`](#512-team-invite---api-team-invite)
6. [Webhooks (Événements)](#6-webhooks-événements)
7. [Intégrations](#7-intégrations)
8. [Limites & Quotas](#8-limites--quotas)

---

## 1. Authentification

### Types de Clés API

| Type | Préfixe | Permissions | Rate Limit | Usage |
|------|---------|------------|------------|-------|
| **Public** | `pk_live_` | Lecture seule (stats) | 100 req/h | Dashboards publics, widgets |
| **Secret** | `sk_live_` | Lecture + Webhooks | 1000 req/h | Intégrations (n8n, Discord, scripts) |
| **Admin** | `ak_live_` | Accès complet (lecture + écriture) | 5000 req/h | Administration, déploiement |

### Créer une clé API

1. Connectez-vous à FactureSmart
2. Allez dans **Paramètres → API**
3. Cliquez sur **Générer une clé**
4. Sélectionnez le type et les permissions
5. **Copiez la clé immédiatement** — elle ne sera plus affichée

### Permissions Granulaires

| Scope | Endpoints concernés |
|-------|-------------------|
| `read:stats` | `/api-stats` |
| `read:transactions` | `/api-transactions` |
| `read:clients` | `/api-clients` |
| `read:factures` | `/api-factures` |
| `read:colis` | `/api-colis` |
| `write:webhooks` | `/api-webhooks` (POST, PUT, DELETE) |
| `read:webhooks` | `/api-webhooks` (GET) |
| `write:dgi` | `/api-dgi-submit`, `/api-dgi-validate` |
| `read:dgi` | `/api-dgi-proxy` (GET) |

---

## 2. Headers & Format

### Headers Requis

```http
X-API-Key: pk_live_xxx / sk_live_xxx / ak_live_xxx
X-Organization-ID: org_votre_organisation_id
Content-Type: application/json
Accept: application/json
```

### Headers Optionnels

| Header | Description |
|--------|------------|
| `Accept-Language` | `fr` (défaut), `en` |
| `X-Request-ID` | ID personnalisé pour le tracing |
| `X-Idempotency-Key` | Clé d'idempotence pour les mutations |

### Format des Dates

Toutes les dates sont en **ISO 8601** (UTC) :
- Date seule : `2024-01-15`
- Date-heure : `2024-01-15T10:30:00Z`
- Intervalle : `2024-01-01_2024-12-31`

### Devises Supportées

| Devise | Code |
|--------|------|
| Franc Congolais | `CDF` |
| Dollar Américain | `USD` |

---

## 3. Pagination

Tous les endpoints GET supportent la pagination.

### Paramètres

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `limit` | number | `50` | Nombre de résultats (max 100) |
| `offset` | number | `0` | Index de départ |

### Réponse

```json
{
  "data": { ... },
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

## 4. Gestion des Erreurs

### Codes HTTP

| Code | Message | Cause |
|------|---------|-------|
| `400` | Bad Request | Paramètres invalides, body mal formé |
| `401` | Unauthorized | Clé API manquante, invalide ou expirée |
| `403` | Forbidden | Permissions insuffisantes pour cette ressource |
| `404` | Not Found | Endpoint ou ressource inexistante |
| `409` | Conflict | Conflit (ex: doublon, DGI déjà soumis) |
| `422` | Unprocessable | Données valides mais logique invalide (ex: TVA incohérente) |
| `429` | Too Many Requests | Rate limit dépassé — attendre `Retry-After` |
| `500` | Internal Server Error | Erreur interne — réessayer plus tard |

### Format Standard d'Erreur

```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "La clé API fournie est invalide ou a expiré",
    "status": 401,
    "details": {
      "key_prefix": "sk_invalid",
      "hint": "Générez une nouvelle clé dans les paramètres"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "documentation_url": "https://docs.facturesmart.com/api"
  }
}
```

### Codes d'Erreur Spécifiques

| Code | Description |
|------|-------------|
| `INVALID_API_KEY` | Clé API invalide ou expirée |
| `INSUFFICIENT_PERMISSIONS` | Scope insuffisant |
| `ORGANIZATION_MISMATCH` | La clé ne correspond pas à l'org |
| `RATE_LIMIT_EXCEEDED` | Trop de requêtes |
| `INVALID_PARAMETER` | Paramètre invalide |
| `RESOURCE_NOT_FOUND` | Ressource inexistante |
| `DGI_API_ERROR` | Erreur de l'API DGI externe |
| `DGI_NOT_CONFIGURED` | DGI_API_KEY non configurée sur le serveur |
| `DGI_ALREADY_SUBMITTED` | Facture déjà soumise à la DGI |
| `WEBHOOK_DELIVERY_FAILED` | Échec de livraison du webhook |
| `IDEMPOTENCY_CONFLICT` | Conflit de clé d'idempotence |

### Retry Strategy (Backoff Exponentiel)

```
1er essai → attendre 1s
2e essai → attendre 2s
3e essai → attendre 4s
4e essai → attendre 8s
Max → 5 tentatives (16s max d'attente totale)
```

Headers de rate limit retournés :

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 985
X-RateLimit-Reset: 1705762800
Retry-After: 42
```

---

## 5. Endpoints

### 5.1 Transactions — `/api-transactions`

**GET** `/api-transactions`

Récupère la liste des transactions financières avec filtres avancés.

**Permission requise :** `read:transactions`

#### Paramètres

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `status` | string | Statut (`Servi`, `Annule`, `En attente`) | `Servi` |
| `currency` | string | Devise | `USD` |
| `type_transaction` | string | Type (`revenue`, `expense`, `transfert`, `caisse`) | `revenue` |
| `client_id` | UUID | Filtrer par client | `abc-123` |
| `date_from` | date | Date début (YYYY-MM-DD) | `2024-01-01` |
| `date_to` | date | Date fin (YYYY-MM-DD) | `2024-12-31` |
| `min_amount` | number | Montant minimum | `100` |
| `max_amount` | number | Montant maximum | `10000` |
| `motif` | string | Recherche textuelle dans le motif | `Commande` |
| `mode_paiement` | string | Mode (`Espèces`, `Mobile Money`, `Carte`, `Virement`) | `Mobile Money` |
| `caisse_id` | UUID | Session de caisse | `caisse_456` |
| `limit` | number | Résultats max (max: 100) | `50` |
| `offset` | number | Pagination | `0` |
| `sort_by` | string | Tri (`date_paiement`, `montant`, `created_at`) | `date_paiement` |
| `sort_order` | string | Ordre (`asc`, `desc`) | `desc` |

#### Réponse (200)

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "date_paiement": "2024-01-15T10:30:00Z",
        "montant": 500,
        "devise": "USD",
        "motif": "Commande client",
        "frais": 25,
        "benefice": 10,
        "mode_paiement": "Mobile Money",
        "statut": "Servi",
        "type_transaction": "revenue",
        "client_id": "cli_456",
        "client_nom": "Jean Dupont",
        "caisse_id": "caisse_789",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "meta": {
    "generated_at": "2024-01-20T15:30:00Z",
    "organization_id": "org_789",
    "response_time_ms": 45
  },
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

#### Exemple cURL

```bash
curl -X GET "https://ddnxtuhswmewoxrwswzg.supabase.co/functions/v1/api-transactions?status=Servi&limit=10" \
  -H "X-API-Key: sk_live_votre_clé" \
  -H "X-Organization-ID: org_votre_id"
```

#### Exemple JavaScript

```javascript
const API_KEY = 'sk_live_votre_clé';
const ORG_ID = 'org_votre_id';

async function getTransactions() {
  const res = await fetch(
    'https://ddnxtuhswmewoxrwswzg.supabase.co/functions/v1/api-transactions?limit=10',
    {
      headers: {
        'X-API-Key': API_KEY,
        'X-Organization-ID': ORG_ID,
      },
    }
  );
  return res.json();
}
```

#### Exemple Python

```python
import requests

response = requests.get(
    'https://ddnxtuhswmewoxrwswzg.supabase.co/functions/v1/api-transactions',
    headers={
        'X-API-Key': 'sk_live_votre_clé',
        'X-Organization-ID': 'org_votre_id',
    },
    params={'limit': 10}
)
print(response.json())
```

---

### 5.2 Clients — `/api-clients`

**GET** `/api-clients`

Récupère la liste des clients avec filtres.

**Permission requise :** `read:clients`

#### Paramètres

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `search` | string | Recherche par nom, téléphone, email | `Jean` |
| `ville` | string | Filtrer par ville | `Kinshasa` |
| `has_transactions` | boolean | Clients avec transactions uniquement | `true` |
| `min_total` | number | Montant total dépensé minimum | `1000` |
| `limit` | number | Résultats max (max: 100) | `50` |
| `offset` | number | Pagination | `0` |
| `sort_by` | string | Tri (`nom`, `total_paye`, `created_at`) | `total_paye` |
| `sort_order` | string | Ordre (`asc`, `desc`) | `desc` |

#### Réponse (200)

```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "cli_123",
        "nom": "Jean Dupont",
        "telephone": "+243812345678",
        "email": "jean@example.com",
        "adresse": "123 Avenue de la Libération",
        "ville": "Kinshasa",
        "province": "Kinshasa",
        "total_paye": 5000,
        "nombre_transactions": 12,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-06-15T00:00:00Z"
      }
    ]
  },
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

### 5.3 Factures & Devis — `/api-factures`

**GET** `/api-factures`

Récupère les factures, devis, avoirs et annulations.

**Permission requise :** `read:factures`

#### Types DGI

| Code | Type | Description |
|------|------|-------------|
| `FV` | Facture de Vente | Facture standard (vente de biens) |
| `EV` | Facture d'Avoir | Avoir / note de crédit (retour marchandise) |
| `FT` | Facture de Travail | Facture de prestation de services |
| `FA` | Facture d'Acompte | Facture d'acompte / avance |
| `ET` | Export Tax | Facture export (hors TVA) |
| `EA` | Encaissement Anticipé | Reçu d'encaissement anticipé |

#### Groupes TVA (RDC)

| Groupe | Taux | Description |
|--------|------|-------------|
| `A` | 0% | Exonéré / export |
| `B` | 8% | Taux réduit (certains biens/services) |
| `C` | 16% | Taux standard |

#### Paramètres

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `type` | string | Type de document (`facture`, `devis`, `avoir`, `annulation`) | `facture` |
| `statut` | string | Statut (`brouillon`, `validee`, `envoyee`, `payee`, `annulee`) | `validee` |
| `client_id` | UUID | Filtrer par client | `abc-123` |
| `date_from` | date | Date début | `2024-01-01` |
| `date_to` | date | Date fin | `2024-12-31` |
| `include_items` | boolean | Inclure les lignes d'articles | `true` |
| `dgi_submitted` | boolean | Filtrer par soumission DGI | `true` |
| `numero_dgi` | string | Rechercher par numéro DGI | `AAMM-12345678` |
| `limit` | number | Résultats max (max: 100) | `50` |
| `offset` | number | Pagination | `0` |

#### Réponse (200)

```json
{
  "success": true,
  "data": {
    "factures": [
      {
        "id": "fac_123",
        "type": "FV",
        "numero": "FACT-2024-0001",
        "client_id": "cli_456",
        "client_nom": "Jean Dupont",
        "client_nif": "A123456789X",
        "montant_ht": 12931.03,
        "tva_montant": 2068.97,
        "montant_total": 15000,
        "devise": "CDF",
        "statut": "Validee",
        "dgi_submitted": true,
        "dgi_code": "DGI-ABC-123-XYZ",
        "numero_dgi": "2401-12345678",
        "code_auth": "AUTH-XXXX-YYYY",
        "qr_code_url": "https://dgi.cd/qr/2401-12345678",
        "items": [
          {
            "article_id": "art_789",
            "description": "Article A",
            "quantite": 2,
            "prix_unitaire": 5000,
            "tva_groupe": "C",
            "tva_taux": 16,
            "montant_tva": 1600,
            "total_ttc": 11600
          }
        ],
        "created_at": "2024-01-15T00:00:00Z",
        "validated_at": "2024-01-16T00:00:00Z"
      }
    ]
  },
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

### 5.4 Statistiques — `/api-stats`

**GET** `/api-stats`

Récupère les statistiques et indicateurs du tableau de bord.

**Permission requise :** `read:stats`

#### Paramètres

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `period` | string | Période (`7d`, `30d`, `90d`, `1y`, `custom`) | `30d` |
| `date_from` | date | Date début (si `period=custom`) | `2024-01-01` |
| `date_to` | date | Date fin (si `period=custom`) | `2024-12-31` |
| `group_by` | string | Groupement (`day`, `week`, `month`) | `month` |
| `currency` | string | Devise | `USD` |

#### Réponse (200)

```json
{
  "success": true,
  "data": {
    "stats": {
      "total_usd": 15000,
      "total_cdf": 5000000,
      "total_frais": 750,
      "total_benefice": 300,
      "nombre_transactions": 45,
      "nombre_clients": 12,
      "nombre_factures": 25,
      "evolution": {
        "revenue_change": 15.5,
        "transaction_change": 8.2,
        "client_change": -2.1
      }
    },
    "graph_data": {
      "daily": [
        { "date": "2024-01-15", "revenue": 500, "transactions": 3, "frais": 25 }
      ]
    },
    "top_clients": [
      { "nom": "Jean Dupont", "total": 5000, "transactions": 12 }
    ],
    "par_devise": {
      "USD": 12000,
      "CDF": 3000000
    }
  },
  "meta": {
    "generated_at": "2024-01-20T15:30:00Z",
    "organization_id": "org_789",
    "period": "30d"
  }
}
```

---

### 5.5 DGI Proxy — `/api-dgi-proxy`

**POST** `/api-dgi-proxy`

Proxy serveur vers l'API DGI RDC. La clé `DGI_API_KEY` est stockée côté serveur et n'est **jamais exposée** au frontend. Si `DGI_API_KEY` n'est pas configurée, retourne une erreur claire.

**Permission requise :** `read:dgi`

#### Actions

Le body doit contenir un champ `action` pour déterminer l'opération :

| Action | Description | Données requises |
|--------|-------------|-----------------|
| `check_nif` | Vérifier un NIF | `{ nif: string, company_name?: string, email?: string }` |
| `submit_facture` | Soumettre une facture | Voir DGI Submit ci-dessous |
| `check_status` | Vérifier statut transmission | `{ transmission_id: string }` ou `{ numero_dgi: string }` |

#### Réponse (200) — check_nif

```json
{
  "success": true,
  "data": {
    "nif": "A123456789X",
    "company_name": "Entreprise ABC",
    "valid": true,
    "tva_assujetti": true
  }
}
```

---

### 5.6 DGI Submit — `/api-dgi-submit`

**POST** `/api-dgi-submit`

Soumet une facture au registre DGI. Génère un numéro DGI (`AAMM-NNNNNNNN`) et un code d'autorisation. Envoie la facture à l'API DGI-RDC si configurée.

**Permission requise :** `write:dgi`

#### Body

```json
{
  "facture_id": "fac_123",
  "force_resubmit": false
}
```

#### Réponse (200)

```json
{
  "success": true,
  "data": {
    "facture_id": "fac_123",
    "numero_dgi": "2401-12345678",
    "dgi_code": "DGI-ABC-123-XYZ",
    "code_auth": "AUTH-XXXX-YYYY",
    "qr_code_url": "https://dgi.cd/qr/2401-12345678",
    "status": "submitted",
    "transmission_id": "trans_abc123",
    "submitted_at": "2024-01-20T15:30:00Z"
  }
}
```

#### Codes d'erreur spécifiques

| Code HTTP | Erreur | Cause |
|-----------|--------|-------|
| 409 | `DGI_ALREADY_SUBMITTED` | Facture déjà soumise (utiliser `force_resubmit:true`) |
| 502 | `DGI_API_ERROR` | API DGI externe indisponible |

---

### 5.7 DGI Validate — `/api-dgi-validate`

**GET** ou **POST** `/api-dgi-validate`

Valide un code d'autorisation et les données QR code du registre DGI. Permet aussi de vérifier le statut d'une facture soumise.

**Permission requise :** `read:dgi` (GET) ou `write:dgi` (POST)

#### Paramètres (GET)

| Paramètre | Type | Description |
|-----------|------|-------------|
| `facture_id` | UUID | ID de la facture |
| `numero_dgi` | string | Numéro DGI (alternative à facture_id) |
| `code_auth` | string | Code d'autorisation à valider |

#### Body (POST)

```json
{
  "facture_id": "fac_123",
  "numero_dgi": "2401-12345678",
  "code_auth": "AUTH-XXXX-YYYY"
}
```

#### Réponse (200)

```json
{
  "success": true,
  "data": {
    "facture_id": "fac_123",
    "numero_dgi": "2401-12345678",
    "status": "valid",
    "validations": {
      "code_auth": { "status": "valid", "message": "Code d'autorisation valide" },
      "dgi_registry": { "status": "valid", "message": "Enregistré dans le registre DGI" },
      "qr_code": { "status": "valid", "message": "QR code valide" }
    },
    "validated_at": "2024-01-20T15:30:00Z"
  }
}
```

---

### 5.8 Webhooks — `/api-webhooks`

**GET** / **POST** / **PUT** / **DELETE** `/api-webhooks`

Gère les webhooks pour les notifications d'événements.

**Permission requise :** `read:webhooks` (GET), `write:webhooks` (POST, PUT, DELETE)

#### GET — Liste des webhooks

```json
{
  "success": true,
  "data": [
    {
      "id": "wh_123",
      "name": "Alertes Transactions",
      "url": "https://hooks.example.com/webhook",
      "events": ["transaction.created", "transaction.validated"],
      "format": "json",
      "active": true,
      "filters": {
        "montant_min": 1000,
        "devise": "USD"
      },
      "last_delivery": "2024-01-20T15:30:00Z",
      "last_status": "success",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST — Créer un webhook

```json
{
  "name": "Alertes Transactions",
  "url": "https://hooks.example.com/webhook",
  "events": ["transaction.created", "transaction.validated"],
  "format": "json",
  "filters": {
    "montant_min": 1000,
    "devise": "USD"
  }
}
```

#### Formats Supportés

| Format | Description | Usage |
|--------|-------------|-------|
| `json` | Payload JSON standard | n8n, webhooks personnalisés |
| `discord` | Embed Discord | Canaux Discord |
| `slack` | Block Kit Slack | Canaux Slack |
| `telegram` | Message Telegram | Chat Telegram |
| `email` | Email HTML | Notifications par email |

---

### 5.9 Colis — `/api-colis`

**GET** `/api-colis`

Récupère les colis et expéditions avec filtres.

**Permission requise :** `read:colis`

#### Paramètres

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `statut` | string | Statut (`En transit`, `Livré`, `En attente`, `Annulé`) | `En transit` |
| `client_id` | UUID | Filtrer par client | `abc-123` |
| `transporteur` | string | Transporteur | `Buckydrop` |
| `date_from` | date | Date début | `2024-01-01` |
| `date_to` | date | Date fin | `2024-12-31` |
| `tracking_number` | string | Numéro de suivi | `BUCK-12345` |
| `limit` | number | Résultats max (max: 100) | `50` |
| `offset` | number | Pagination | `0` |

#### Réponse (200)

```json
{
  "success": true,
  "data": {
    "colis": [
      {
        "id": "col_123",
        "tracking_number": "BUCK-12345",
        "client_id": "cli_456",
        "client_nom": "Jean Dupont",
        "description": "Électronique",
        "poids_kg": 2.5,
        "transporteur": "Buckydrop",
        "statut": "En transit",
        "origine": "Shenzhen",
        "destination": "Lubumbashi",
        "date_expedition": "2024-01-10T00:00:00Z",
        "date_livraison_prevue": "2024-01-25T00:00:00Z",
        "date_livraison_reelle": null,
        "created_at": "2024-01-05T00:00:00Z"
      }
    ]
  },
  "pagination": {
    "total": 8,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

### 5.10 Email — `/api-email-send`

**POST** `/api-email-send`

Proxy serveur vers l'API Resend pour l'envoi d'emails. La clé `RESEND_API_KEY` est stockée côté serveur.

**Permission requise :** `read:transactions` (minimum)

#### Body

```json
{
  "to": ["client@example.com"],
  "subject": "Votre facture FACT-2024-0001",
  "html": "<h1>Bonjour</h1><p>Votre facture est disponible.</p>",
  "attachment_urls": ["https://.../facture.pdf"]
}
```

#### Réponse (200)

```json
{
  "success": true,
  "data": {
    "id": "email_abc123",
    "to": ["client@example.com"],
    "from": "FactureSmart <noreply@facturesmart.com>",
    "subject": "Votre facture FACT-2024-0001",
    "sent_at": "2024-01-20T15:30:00Z"
  }
}
```

---

### 5.11 Telegram — `/api-telegram-send`

**POST** `/api-telegram-send`

Proxy serveur vers l'API Telegram Bot pour envoyer des notifications. Le token du bot est stocké côté serveur.

**Permission requise :** `read:transactions` (minimum)

#### Body

```json
{
  "chat_id": "-1001234567890",
  "text": "Nouvelle transaction : 500 USD - Jean Dupont",
  "parse_mode": "HTML",
  "disable_notification": false
}
```

---

### 5.12 Team Invite — `/api-team-invite`

**POST** `/api-team-invite`

Crée une invitation d'équipe et envoie un email. Réservé aux administrateurs.

**Permission requise :** Admin uniquement (vérification côté serveur)

#### Body

```json
{
  "email": "nouveau@example.com",
  "role": "comptable",
  "message": "Bienvenue dans l'équipe !"
}
```

#### Réponse (200)

```json
{
  "success": true,
  "data": {
    "invite_id": "inv_123",
    "email": "nouveau@example.com",
    "role": "comptable",
    "status": "pending",
    "expires_at": "2024-02-20T15:30:00Z",
    "invite_url": "https://facturesmart.com/invite/abc123"
  }
}
```

---

## 6. Webhooks (Événements)

### Événements Disponibles

| Événement | Description | Scope requis |
|-----------|-------------|-------------|
| `transaction.created` | Nouvelle transaction créée | `read:transactions` |
| `transaction.validated` | Transaction passée à "Servi" | `read:transactions` |
| `transaction.deleted` | Transaction supprimée | `read:transactions` |
| `facture.created` | Nouvelle facture/devis créé | `read:factures` |
| `facture.validated` | Facture validée | `read:factures` |
| `facture.paid` | Facture marquée comme payée | `read:factures` |
| `facture.cancelled` | Facture annulée | `read:factures` |
| `facture.dgi_submitted` | Facture soumise à la DGI | `read:factures` |
| `client.created` | Nouveau client ajouté | `read:clients` |
| `client.updated` | Client mis à jour | `read:clients` |
| `colis.status_changed` | Changement de statut colis | `read:colis` |
| `caisse.session_opened` | Session de caisse ouverte | `read:transactions` |
| `caisse.session_closed` | Session de caisse fermée | `read:transactions` |

### Payload Standard

```json
{
  "event": "transaction.created",
  "timestamp": "2024-01-20T15:30:00Z",
  "organization_id": "org_123",
  "data": {
    "id": "txn_456",
    "montant": 500,
    "devise": "USD",
    "client_nom": "Jean Dupont"
  },
  "signature": "sha256=abc123..."
}
```

### Vérification HMAC

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

### Exemple n8n

```json
{
  "nodes": [
    {
      "parameters": {
        "url": "https://ddnxtuhswmewoxrwswzg.supabase.co/functions/v1/api-transactions",
        "authentication": "headerAuth",
        "options": {
          "queryParameters": {
            "status": "Servi",
            "date_from": "={{ $today }}",
            "limit": "100"
          }
        }
      },
      "name": "Récupérer Transactions",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}
```

### Exemple Discord

Créez un webhook Discord et utilisez l'API FactureSmart avec le format `discord` :

```bash
curl -X POST "https://ddnxtuhswmewoxrwswzg.supabase.co/functions/v1/api-webhooks" \
  -H "X-API-Key: sk_live_votre_clé" \
  -H "X-Organization-ID: org_votre_id" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alertes Discord",
    "url": "https://discord.com/api/webhooks/...",
    "events": ["transaction.created", "transaction.validated"],
    "format": "discord",
    "filters": {
      "montant_min": 1000,
      "devise": "USD"
    }
  }'

```

Le payload sera automatiquement formaté en embed Discord.

---

## 7. Intégrations

### n8n — Workflow Automatisation

1. Créez un **Credential** de type **HTTP Header Auth**
2. Ajoutez les headers : `X-API-Key` et `X-Organization-ID`
3. Utilisez le nœud **HTTP Request** pour appeler n'importe quel endpoint

### Discord — Notifications

Créez un **webhook Discord** et enregistrez-le dans FactureSmart avec le format `discord`. Les notifications arriveront formatées en embed.

### Telegram — Alertes Mobiles

Configurez un **bot Telegram** via BotFather et enregistrez le token dans les paramètres FactureSmart. Utilisez le format `telegram` pour les webhooks.

### JavaScript (fetch)

```javascript
const API_KEY = 'sk_live_votre_clé';
const ORG_ID = 'org_votre_id';

async function getStats() {
  const res = await fetch(
    'https://ddnxtuhswmewoxrwswzg.supabase.co/functions/v1/api-stats?period=30d',
    {
      headers: {
        'X-API-Key': API_KEY,
        'X-Organization-ID': ORG_ID,
      },
    }
  );
  return res.json();
}
```

### Python (requests)

```python
import requests

response = requests.get(
    'https://ddnxtuhswmewoxrwswzg.supabase.co/functions/v1/api-stats',
    headers={
        'X-API-Key': 'sk_live_votre_clé',
        'X-Organization-ID': 'org_votre_id',
    },
    params={'period': '30d'}
)
print(response.json())
```

### Google Apps Script

```javascript
function getTransactions() {
  const options = {
    headers: {
      'X-API-Key': 'sk_live_votre_clé',
      'X-Organization-ID': 'org_votre_id',
    },
  };
  const response = UrlFetchApp.fetch(
    'https://ddnxtuhswmewoxrwswzg.supabase.co/functions/v1/api-transactions?limit=10',
    options
  );
  return JSON.parse(response.getContentText());
}
```

---

## 8. Limites & Quotas

| Limite | Valeur |
|--------|--------|
| Rate limit (Public) | 100 req/h |
| Rate limit (Secret) | 1000 req/h |
| Rate limit (Admin) | 5000 req/h |
| Taille max requête | 1 MB |
| Timeout | 30 secondes |
| Pagination max | 100 résultats/page |
| Webhooks max | 50 par organisation |
| Clés API max | 10 par organisation |

### Headers de Rate Limit

Chaque réponse inclut :

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 985
X-RateLimit-Reset: 1705762800
Retry-After: 42
```

### Best Practices

1. **Cachez les réponses** — Les stats peuvent être mises en cache 30-60s
2. **Utilisez l'idempotence** — Ajoutez `X-Idempotency-Key` pour les mutations
3. **Paginatez systématiquement** — Ne demandez jamais plus de 100 résultats
4. **Gérez le rate limit** — Utilisez le header `Retry-After` pour backoff
5. **Limitez les appels en boucle** — Préférez les webhooks au polling
6. **Sécurisez vos clés** — Ne stockez jamais les clés Secret/Admin dans le frontend

---

## Changelog

| Version | Date | Changements |
|---------|------|-------------|
| v1.0 | 2024-01 | Version initiale — Phase 1 (transactions, clients, factures, stats, webhooks) |
| v1.1 | 2024-06 | Phase 2 — DGI (proxy, submit, validate), colis, email, telegram, team-invite |

---

*Documentation générée depuis le code source. Dernière mise à jour : Juin 2024.*