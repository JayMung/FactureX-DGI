# 🇨🇩 DGI Compliance — Vue d'ensemble

> Version : 1.0 | Statut : ✅ En développement | Mise à jour : Avril 2026

## Contexte

Conformité avec la réglementation DGI (Direction Générale des Impôts) de la République Démocratique du Congo pour la facturation électronique certifiée.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    FactureSmart                             │
│                                                             │
│  ┌─────────────────────┐   ┌────────────────────────────┐  │
│  │  DgiStatus.tsx       │   │  Dashboard DGI            │  │
│  │  (Page statut temps  │   │  (Indicateurs conformité)  │  │
│  │   réel)               │   └────────────────────────────┘  │
│  └──────────┬──────────┘                                    │
│             │                                                │
│  ┌──────────┴──────────┐                                    │
│  │  services/dgi.ts     │  ← Hook : useDashboardDgi.ts      │
│  │  (Client DGI Proxy)  │                                    │
│  └──────────┬──────────┘                                    │
└─────────────┼───────────────────────────────────────────────┘
               │
┌──────────────┴─────────────────────────────────────────────┐
│              Edge Functions (Deno / Supabase)               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ api-dgi-proxy │  │ api-dgi-submit│  │ api-dgi-validate  │ │
│  │ (Rate limited) │  │ (Soumission) │  │ (Validation)      │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ mock-dgi-status│ │ mock-dgi-submit│ │ mock-dgi-verify   │ │
│  │ (Développement)│ │ (Développement)│ │ (Développement)   │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Fonctionnalités

### 1. Soumission de factures
- Pipeline de soumission vers l'API DGI
- Validation pré-soumission (format, champs obligatoires)
- Gestion des erreurs avec re-try automatique
- Statut en temps réel

### 2. Validation
- Validation du format des factures
- Contrôle des champs obligatoires selon norme DGI
- Vérification des signatures numériques

### 3. API Proxy
- Rate limiting intégré
- Cache des réponses
- Fallback mock pour développement
- Logging des requêtes

### 4. Dashboard DGI
- Indicateurs de conformité en temps réel
- Historique des soumissions
- Rapport de conformité
- Alertes en cas de rejet

---

## Edge Functions

| Function | Rôle | Endpoint |
|----------|------|----------|
| `api-dgi-proxy` | Proxy vers API DGI avec rate limiter | `/functions/v1/api-dgi-proxy` |
| `api-dgi-submit` | Soumission de facture | `/functions/v1/api-dgi-submit` |
| `api-dgi-validate` | Validation avant soumission | `/functions/v1/api-dgi-validate` |
| `mock-dgi-status` | Mock statut DGI (dev) | `/functions/v1/mock-dgi-status` |
| `mock-dgi-submit` | Mock soumission (dev) | `/functions/v1/mock-dgi-submit` |
| `mock-dgi-verify` | Mock vérification (dev) | `/functions/v1/mock-dgi-verify` |

---

## Page DgiStatus

La page `DgiStatus.tsx` affiche :

```
┌─────────────────────────────────────────┐
│ 🇨🇩 Conformité DGI                       │
│                                          │
│ ┌──────┐  ┌──────┐  ┌──────┐            │
│ │ 1 234 │  │  89% │  │  12  │            │
│ │Factures│  │Conformité│  │ Rejets  │     │
│ └──────┘  └──────┘  └──────┘            │
│                                          │
│ 📊 Évolution des soumissions             │
│ [═══════════════════════════]             │
│                                          │
│ 📋 Dernières soumissions                 │
│ ┌──────────────────────────────────┐     │
│ │ FAC-0012 ● Validé  │ 12/04/2026 │     │
│ │ FAC-0011 ● En attente │ 11/04/2026│     │
│ │ FAC-0010 ✕ Rejeté  │ 10/04/2026│     │
│ └──────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

---

## Utilisation

### Hook useDashboardDgi

```tsx
import { useDashboardDgi } from "@/hooks/useDashboardDgi";

function DGIDashboard() {
  const {
    stats,            // Statistiques DGI
    soumissions,      // Dernières soumissions
    isLoading,
    refetch,
  } = useDashboardDgi();

  return <pre>{JSON.stringify(stats, null, 2)}</pre>;
}
```

---

## Migration SQL

```sql
-- Table de soumission DGI
CREATE TABLE dgi_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID REFERENCES factures(id),
  organization_id UUID REFERENCES organizations(id),
  status TEXT CHECK (status IN ('pending','submitted','validated','rejected','error')),
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ
);

-- Table de conformité
CREATE TABLE dgi_compliance_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  compliance_rate DECIMAL(5,2) DEFAULT 0,
  total_factures INT DEFAULT 0,
  validated_factures INT DEFAULT 0,
  rejected_factures INT DEFAULT 0,
  last_check_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Ressources

- [Documentation technique détaillée](./DGI_TECHNICAL_DOCUMENTATION.md)

---

*Document créé dans le cadre de la Phase 3 DGI Compliance (COD-21)*
