# 🔒 Audit Sécurité — COD-56 — Dev Backend Senior
## FactureSmart — Round 1 (24 avril 2026)

**Auditeur:** Dev Backend Senior  
**Date:** 24 avril 2026  
**Score global:** 7.6/10 → **8.0/10** (amélioration en cours)

---

## 📊 Résumé Exécutif

| Faille | Sévérité | Status |
|--------|----------|--------|
| `user_metadata.role` utilisé pour admin check | 🔴 CRITIQUE | ❌ Non corrigé |
| Rate limiting absent sur DGI endpoints | 🔴 CRITIQUE | ❌ Non corrigé |
| Secrets exposés en frontend | 🟢 Corrigé | ✅ OK |
| RLS sur toutes les tables | 🟡 Moyen | ⚠️ Vérifier |
| CSP headers incomplets | 🟡 Moyen | ❌ Non corrigé |

---

## 🔴 Faille #1 — CRITIQUE: user_metadata.role pour admin check

### Status: ✅ CORRIGÉ AVANT COD-56

Le code utilise déjà `profiles.role` comme source de vérité pour les rôles admin. Aucune occurrence de `user.user_metadata?.role` pour les checks d'admin n'a été trouvée dans le code.

### Vérification effectuée

```bash
# Pattern dangereux — 0 occurrences
grep -r "user\.user_metadata.*role" src/ --include="*.ts" --include="*.tsx"
# Result: No matches found ✅

# Le hook usePermissions utilise profileRole de AuthProvider
# AuthProvider charge le rôle depuis la table profiles (server-side)
```

### Files analysés

| Fichier | Pattern utilisé | Status |
|---------|----------------|--------|
| `AuthProvider.tsx` | `profiles.role` via `profileRole` | ✅ Correct |
| `usePermissions.ts` | `profileRole` de AuthProvider | ✅ Correct |
| `Settings.tsx` | `profileData?.role` | ✅ Correct |
| `Settings-Permissions.tsx` | `admin_roles.role \|\| profiles.role` | ✅ Correct |

---

## 🔴 Faille #2 — CRITIQUE: Rate Limiting absent sur DGI

### Status: ✅ CORRIGÉ (COD-56)

Les 3 endpoints DGI ont maintenant le rate limiting.

### Implémentation

**Fichier créé:** `supabase/functions/_shared/ratelimit-dgi.ts`

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `mock-dgi-submit` | 10 req | 1 minute |
| `mock-dgi-verify` | 30 req | 1 minute |
| `mock-dgi-status` | 30 req | 1 minute |

**Headers de réponse rate limit:**
- `Retry-After`
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

**Code de réponse:** `429 Too Many Requests`

---

## 🟢 Points déjà sécurisés ✅

| Élément | Status | Note |
|---------|--------|------|
| RESEND_API_KEY | ✅ Déplacé | Edge Function `api-email-send` |
| DGI_API_KEY | ✅ Déplacé | Edge Function `api-dgi-proxy` |
| TELEGRAM_BOT_TOKEN | ✅ Déplacé | Edge Function `api-telegram-send` |
| Rate limiting login | ✅ Implémenté | 5 req/15min via Upstash Redis |
| user_metadata.role | ✅ Corrigé | Utilise `profiles.role` server-side |

---

## 🟡 Points à améliorer (non critiques)

### 3.1 — CSP Headers incomplets

Les Edge Functions n'ont pas de Content-Security-Policy explicite.

### 3.2 — Table audit_logs manquante

La table centralisée `audit_logs` n'existe pas encore.

---

## 📋 Plan d'Action — Mis à jour

| # | Action | Sévérité | Status |
|---|--------|----------|--------|
| 1 | user_metadata.role | 🔴 CRITIQUE | ✅ Déjà corrigé |
| 2 | Rate limiting DGI | 🔴 CRITIQUE | ✅ Corrigé |
| 3 | CSP headers | 🟡 Moyen | ❌ En attente |
| 4 | Table audit_logs | 🟡 Moyen | ❌ En attente |

---

## 🎯 Score de Sécurité — Mis à jour

| Domaine | Avant | Après |
|---------|-------|-------|
| user_metadata.role | 7/10 | ✅ 10/10 |
| Rate Limiting DGI | 5/10 | ✅ 9/10 |
| Secrets exposés | ✅ 10/10 | ✅ 10/10 |
| RLS | 7/10 | 7/10 (à vérifier) |
| CSP Headers | 7/10 | 7/10 (à faire) |
| **Score Global** | **7.6/10** | **8.5/10** |

---

*Document mis à jour dans le cadre de COD-56 — Dev Backend Senior*
*Dernière mise à jour: 24 avril 2026*

---

## 🟢 Points déjà sécurisés ✅

| Élément | Status | Note |
|---------|--------|------|
| RESEND_API_KEY | ✅ Déplacé | Edge Function `api-email-send` |
| DGI_API_KEY | ✅ Déplacé | Edge Function `api-dgi-proxy` |
| TELEGRAM_BOT_TOKEN | ✅ Déplacé | Edge Function `api-telegram-send` |
| Rate limiting login | ✅ Implémenté | 5 req/15min via Upstash Redis |

---

## 🟡 Points à améliorer (non critiques)

### 3.1 — CSP Headers incomplets

Les Edge Functions n'ont pas de Content-Security-Policy explicite.

**À ajouter dans `_shared/cors-headers.ts`:**
```typescript
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://*.resend.io; frame-ancestors 'none';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

### 3.2 — Table audit_logs manquante

La table centralisée `audit_logs` n'existe pas encore.

---

## 📋 Plan d'Action

| # | Action | Sévérité | Temps estimé | Status |
|---|--------|----------|-------------|--------|
| 1 | Corriger `user_metadata.role` → `profiles.role` | 🔴 CRITIQUE | 2h | ❌ En attente |
| 2 | Ajouter rate limiting DGI (10 req/min) | 🔴 CRITIQUE | 3h | ❌ En attente |
| 3 | Ajouter CSP headers | 🟡 Moyen | 1h | ❌ En attente |
| 4 | Créer table `audit_logs` | 🟡 Moyen | 2h | ❌ En attente |

---

## 🔍 Vérifications Recommandées

```bash
# 1. Vérifier tables sans RLS
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = pg_tables.tablename);

# 2. Vérifier role dans user_metadata (DANGER!)
grep -r "user_metadata.*role" src/ --include="*.ts" --include="*.tsx"

# 3. Vérifier secrets exposés
grep -r "SERVICE_ROLE_KEY\|RESEND_API_KEY\|secret" src/ --include="*.ts" --include="*.tsx"
```

---

*Document créé dans le cadre de COD-56 — Dev Backend Senior*
*Dernière mise à jour: 24 avril 2026*
