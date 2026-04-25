# Documentation Technique DGI — FactureSmart

**Version :** 1.0  
**Date :** 24 avril 2026  
**Statut :** Phase 3 — Prêt pour intégration sandbox DGI-RDC

---

## 1. Vue d'ensemble

Cette documentation décrit l'intégration de FactureSmart avec l'API DGI-RDC (Direction Générale des Impôts de la République Démocratique du Congo) pour la conformité fiscale des factures électroniques.

### Objectif
Permettre à FactureSmart d'envoyer les factures validées au registre DGI, d'obtenir un code d'autorisation unique et un QR code, conformément aux exigences de l'ONI (Office National des Impôts) de la RDC.

### Périmètre
- Types de factures DGI : FV, EV, FT, ET, FA, EA
- Groupe TVA : A (0%), B (8%), C (16%)
- Numérotation DGI : `AAMM-NNNNNNNN` (8 chiffres)
- Code QR DGI avec données encodées

---

## 2. Types de factures DGI

| Code | Type | Description |
|------|------|-------------|
| **FV** | Facture de Vente | Facture standard de vente de biens |
| **EV** | Facture d'Avoir | Note de crédit (marchandises retournées) |
| **FT** | Facture de Travail | Facture de prestation de services/travail |
| **ET** | Export Tax | Facture de droits à l'export |
| **FA** | Facture d'Acompte | Facture d'acompte/paiement anticipé |
| **EA** | Facture d'Encaissement Anticipé | Reçu d'encaissement anticipé |

---

## 3. Groupes TVA (RDC)

| Groupe | Taux TVA | Description | Exemples |
|--------|----------|-------------|----------|
| **A** | 0% | Exonéré | Exports, produits de première nécessité |
| **B** | 8% | Réduit | Certains services, biens spécifiés |
| **C** | 16% | Normal | Opérations standard (défaut) |

---

## 4. Architecture de l'intégration

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FactureSmart (Frontend)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Factures-    │  │ Factures-    │  │ dgiUtils.ts             │  │
│  │ Create.tsx   │  │ Preview.tsx  │  │ dgiInvoicePdfGenerator  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                     │                   │
└─────────┼─────────────────┼─────────────────────┼───────────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Supabase (Backend)                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Edge Functions                                                 │   │
│  │  ├── api-dgi-submit   → POST /api-dgi-submit                │   │
│  │  ├── api-dgi-validate → GET|POST /api-dgi-validate         │   │
│  │  ├── mock-dgi-submit  → Mock sandbox DGI                   │   │
│  │  └── mock-dgi-verify  → Mock vérification                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Database                                                       │   │
│  │  ├── factures (cols DGI: type_facture_dgi, groupe_tva,      │   │
│  │  │             montant_ht, montant_tva, montant_ttc,           │   │
│  │  │             numero_dgi, code_auth, qr_code_data, dgi_status)│   │
│  │  └── dgi_invoice_registry (table de traçabilité)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼ (when DGI credentials available)
┌─────────────────────────────────────────────────────────────────────┐
│                    DGI-RDC API (Production)                        │
│  Base URL: https://dgi.example.cd/api/v1 (configurable)            │
│  Auth: Bearer token (DGI_API_KEY)                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Edge Functions — Spécifications

### 5.1 `api-dgi-submit` (POST)

**Fonction :** Soumettre une facture au registre DGI et obtenir code d'autorisation + QR code.

**Headers requis :**
```
Content-Type: application/json
apikey: [SUPABASE_API_KEY]
Authorization: Bearer [SUPABASE_SERVICE_ROLE_KEY]
```

**Body :**
```json
{
  "facture_id": "uuid",
  "type_facture_dgi": "FV",
  "groupe_tva": "C",
  "montant_ht": 10000.00,
  "montant_tva": 1600.00,
  "montant_ttc": 11600.00,
  "client_nom": "Nom du client",
  "client_nif": "NIF du client (optionnel)",
  "items": [
    {
      "description": "Article 1",
      "quantite": 10,
      "prix_unitaire": 1000.00,
      "montant_total": 10000.00
    }
  ],
  "date_emission": "2026-04-24",
  "devise": "USD"
}
```

**Réponse succès :**
```json
{
  "success": true,
  "data": {
    "numero_dgi": "2604-00000001",
    "code_auth": "AUTH-2026-XXXXXX",
    "qr_code_data": "https://dgi.cd/verify/...",
    "dgi_status": "validé",
    "timestamp": "2026-04-24T12:00:00Z"
  }
}
```

**Réponse erreur :**
```json
{
  "success": false,
  "error": {
    "code": "DGI_001",
    "message": "Type de facture DGI invalide"
  }
}
```

### 5.2 `api-dgi-validate` (GET/POST)

**Fonction :** Valider un code d'autorisation ou QR code DGI existant.

**GET** — Vérifier un code :
```
GET /api-dgi-validate?code=AUTH-2026-XXXXXX
```

**POST** — Vérifier plusieurs codes :
```json
{
  "codes": ["AUTH-2026-XXXXXX", "AUTH-2026-YYYYYY"]
}
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "code": "AUTH-2026-XXXXXX",
      "numero_dgi": "2604-00000001",
      "statut": "validé",
      "valide": true
    }
  ]
}
```

---

## 6. Base de données — Schéma

### 6.1 Table `factures` — Colonnes DGI

```sql
-- Type de facture DGI (FV/EV/FT/ET/FA/EA)
type_facture_dgi VARCHAR(2) DEFAULT 'FV',

-- Groupe TVA (A=0%, B=8%, C=16%)
groupe_tva VARCHAR(1) DEFAULT 'C',

-- Montants HT/TVA/TTC (en CDF ou USD selon facture)
montant_ht DECIMAL(15,2),
montant_tva DECIMAL(15,2),
montant_ttc DECIMAL(15,2),

-- Numéro DGI attribué par le registre (format: AAMM-NNNNNNNN)
numero_dgi VARCHAR(20),

-- Code d'autorisation DGI
code_auth VARCHAR(50),

-- QR code data (URL de vérification)
qr_code_data TEXT,

-- Statut DGI
dgi_status VARCHAR(20) DEFAULT 'en_attente',
-- Values: en_attente, soumis, validé, rejeté, expiré

-- Timestamp mise à jour
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### 6.2 Table `dgi_invoice_registry`

```sql
CREATE TABLE dgi_invoice_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES factures(id),
  numero_dgi VARCHAR(20) NOT NULL,
  code_auth VARCHAR(50) NOT NULL,
  qr_code_data TEXT,
  type_facture_dgi VARCHAR(2) NOT NULL,
  groupe_tva VARCHAR(1) NOT NULL,
  montant_ht DECIMAL(15,2) NOT NULL,
  montant_tva DECIMAL(15,2) NOT NULL,
  montant_ttc DECIMAL(15,2) NOT NULL,
  dgi_status VARCHAR(20) DEFAULT 'en_attente',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Variables d'environnement

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# DGI API (à obtenir auprès de la DGI-RDC)
DGI_API_URL=https://dgi.example.cd/api/v1
DGI_API_KEY=your-dgi-api-key
DGI_ORGANIZATION_ID=your-org-id
```

---

## 8. Numérotation DGI

**Format :** `AAMM-NNNNNNNN`

- `AA` = Année (ex: 26 pour 2026)
- `MM` = Mois (ex: 04 pour avril)
- `NNNNNNNN` = 8 chiffres séquentiels, starts at 00000001

**Exemples :**
- `2604-00000001` = Première facture avril 2026
- `2604-00000015` = Quinzième facture avril 2026

---

## 9. Calculs TVA

```typescript
const TVA_RATES = {
  A: 0,      // 0%
  B: 0.08,   // 8%
  C: 0.16    // 16%
};

// Montant TVA = Montant HT × Taux TVA
const montantTva = montantHt * TVA_RATES[groupeTva];

// Montant TTC = Montant HT + Montant TVA
const montantTtc = montantHt + montantTva;
```

---

## 10. États DGI

| Statut | Description |
|--------|-------------|
| `en_attente` | Facture créée, pas encore soumise à la DGI |
| `soumis` | Soumis au registre DGI, en attente de validation |
| `validé` | Approuvé par la DGI, code d'autorisation reçu |
| `rejeté` | Rejeté par la DGI (erreur de validation) |
| `expiré` | Code expiré (à revalider) |

---

## 11. Guide utilisateur

### Pour créer une facture DGI conforme :

1. **Aller dans** Factures → Nouvelle facture
2. **Sélectionner le client** (obligatoire)
3. **Choisir le type DGI** dans le menu déroulant (défaut: FV)
   - FV = Facture de Vente
   - FA = Facture d'Acompte
   - etc.
4. **Sélectionner le groupe TVA** (A, B ou C — défaut: C 16%)
5. **Les montants HT/TVA/TTC** se calculent automatiquement
6. **Ajouter les articles** normalement
7. **Enregistrer** — la facture est soumise automatiquement à la DGI
8. **Récupérer** le numéro DGI et code d'autorisation après validation

### Statuts DGI sur la facture :

| Badge | Signification |
|-------|---------------|
| ⏳ En attente | Facture créée, non encore soumise |
| 📤 Soumis | Transmis à la DGI, en attente |
| ✅ Validé | Code DGI reçu — facture conforme |
| ❌ Rejeté | Erreur — vérifier les données |
