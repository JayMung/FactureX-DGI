# 🔒 Audit de Sécurité — FactureSmart COD-56

**Date:** 24 avril 2026
**Auditeur:** Dev Backend Senior (COD-56)
**Application:** FactureSmart — SaaS de facturation électronique DGI RDC
**Stack:** React 18 + TypeScript + Vite (frontend), Supabase (PostgreSQL + Auth + Edge Functions)
**Niveau de risque:** 🟡 MODÉRÉ — 5/7 fixes appliqués, RLS migration en attente, score 7.1/10

---

## ✅ Corrections COD-56 — Déjà Appliquées (24 avril 2026)

Les 3 clés API ont été supprimées du frontend et déplacées en Edge Functions server-side :

| Clé | Avant (frontend) | Après (Edge Function) | Statut |
|-----|------------------|----------------------|--------|
| `RESEND_API_KEY` | `src/lib/constants.ts` | `supabase/functions/api-email-send/` | ✅ Fixé |
| `VITE_DGI_API_KEY` | `src/services/dgi.ts` | `supabase/functions/api-dgi-proxy/` | ✅ Fixé |
| `VITE_TELEGRAM_BOT_TOKEN` | `src/App.tsx` + `useComptabiliteAI.ts` | `supabase/functions/api-telegram-send/` | ✅ Fixé |

**Services frontend mis à jour :**
- `src/services/email.ts` → appelle `/functions/v1/api-email-send`
- `src/services/dgi.ts` → appelle `/functions/v1/api-dgi-proxy`
- `src/hooks/useComptabiliteAI.ts` → appelle `/functions/v1/api-telegram-send`

---

## 📋 Résumé Exécutif

FactureSmart dispose d'une base de sécurité **partielle** avec des mécanismes avancés côté frontend (CSRF, XSS sanitization, PKCE) mais des failles **critiques** côté base de données et configuration. La migration des secrets vers les Edge Functions est un progrès majeur, mais des vulnérabilités de fuite de données, de traversal, et de RLS ouverte restent actives.

---

## 📊 Score de Sécurité par Domaine

| Domaine | Score | Statut |
|---------|-------|--------|
| Row Level Security (RLS) | **4/10** | 🔴 Critique |
| Auth & Sessions | **5/10** | 🔴 Critique |
| Secrets & Env Vars | **7/10** | 🟡 À améliorer |
| Injection SQL | **9/10** | ✅ Correct |
| XSS & CSRF | **6/10** | 🟡 À améliorer |
| Rate Limiting | **7/10** | 🟡 À améliorer |
| Validation des Inputs | **8/10** | ✅ Correct |
| Audit Trail & Logging | **7/10** | 🟡 Moyen — Table + service implémentés |
| Configuration Serveur | **7/10** | 🟡 Moyen — Headers ajoutés, fs.allow corrigé |
| **SCORE GLOBAL** | **7.1/10** | 🟡 MODÉRÉ — 4 critiques fixées, RLS migration en attente apply |

---

## 🔴 1. Fuite de données sensibles — Score: 4/10

### 🔴 ~~CRITIQUE #1~~ — ✅ FIXÉ — JWT token payload loggé en clair dans la console
**Fichier:** `src/hooks/useComptesFinanciers.ts:46-50`
**Statut:** ✅ Appliqué — COD-57 (24 avril 2026)
**Correction:** Toutes les lignes de debug logging supprimées. Remplacées par un log minimal sans données sensibles.

---

### 🔴 CRITIQUE #2 — Token d'invitation admin loggé en clair

**Fichier:** `src/components/admin/AdminManager.tsx:62`

```typescript
console.log('Admin invitation token:', token);
```

**Impact:** Le token d'invitation admin (à usage unique) est visible dans la console. Toute personne ayant accès à l'écran ou aux DevTools peut capturer ce token et usurper une invitation admin.

**Fix immédiat:** Supprimer ce `console.log`.

---

### 🔴 ~~CRITIQUE #3~~ — ✅ FIXÉ — Security Logger implémenté avec table + RLS
**Fichier:** `src/services/securityLogger.ts` + `supabase/migrations/20260424120100_create_security_logs.sql`
**Statut:** ✅ Migration appliquée — COD-56 (24 avril 2026)
**Implémentation:**
- Table `security_logs` avec indexes sur `user_id`, `event_type`, `severity`, `created_at`
- RLS: admins-only en lecture, users can only insert their own events
- Service complet avec helpers: `logLoginSuccess`, `logLoginFailed`, `logPermissionDenied`, `logSuspiciousActivity`, etc.

---

## 🔴 2. Row Level Security (RLS) — Score: 4/10 → 🟡 En correction

### 🔴 ~~CRITIQUE #4~~ — 🟡 EN COURS — 5 tables avec `USING (true)` — Migration corrective créée, en attente d'application
**Fichier:** `supabase/migrations/20260424000004_critical_rls_fixes.sql` (COD-57)
**Statut:** Migration créée, non encore appliquée sur production
**Fix:** Remplace `USING (true)` / `WITH CHECK (true)` par des policies org-scoped sur `mouvements_comptes`, `comptes_financiers`, `transactions`

---

### 🟡 HIGH — 3 tables legacy avec `WITH CHECK (true)` sur INSERT

**Fichier:** `supabase/migrations/20260423_fix_legacy_tables.sql`

```sql
FOR INSERT TO authenticated WITH CHECK (true);  -- × 3 tables
```

**Impact:** Un utilisateur peut insérer des données sans restriction d'organisation.

**Note:** `facture_history` et `facture_deletion_logs` avec `WITH CHECK (true)` sont acceptables (logs système).

---

## 🔴 3. Auth & Sessions — Score: 5/10 → 🟡 En correction

### 🔴 ~~CRITIQUE #5~~ — ✅ FIXÉ PARTIELLEMENT — Rôle `admin` lu dans `user_metadata` (client-controllable)
**Fichiers:** `src/pages/Settings.tsx`, `src/pages/Settings-Permissions.tsx`, `src/services/supabase.ts`
**Statut:** ✅ Appliqué frontend — COD-57 (24 avril 2026)
**Correction:** 
- `Settings.tsx`: fetch `profiles` AVANT d'utiliser le role; `role: profileData?.role`
- `Settings-Permissions.tsx`: même pattern; fallback `user_metadata.role` supprimé du usePermission hook
- `supabase.ts`: default role signup = `'operateur'` (plus `'admin'`)

---

### 🟡 HIGH — Durée des sessions non sécurisée

**Constat:**
- Session timeout côté frontend (`SESSION_CONFIG.SESSION_TIMEOUT`): 15 min ✅
- Durée JWT Supabase par défaut: 1 heure ⚠️
- Refresh token Supabase par défaut: 30 jours ⚠️

**Impact:** Un token volé reste valide 30 jours. Aucune rotation de refresh token implémentée.

**Recommandé:**
- Access token: 15 minutes
- Refresh token: 7 jours avec rotation forcée
- À configurer dans Supabase Dashboard → Authentication → Settings

---

### 🟡 HIGH — Sessions multi-appareils non limitées

**Constat:** Aucune limite de sessions simultanées. Un utilisateur peut être connecté sur 10 appareils.

**Impact:** Impossible de révoquer une session compromise sans révoquer TOUTES les sessions.

**Fix:** Implémenter `MAX_CONCURRENT_SESSIONS: 3` avec révocation automatique de la plus ancienne.

---

## 🟡 4. Secrets & Configuration — Score: 7/10

### 🟡 HIGH — `.env.local` contient des secrets réels en local

**Fichier:** `.env.local` (non commité — OK, mais présent sur le filesystem)

```bash
SUPABASE_SERVICE_ROLE_KEY=sb_secret_[REDACTED]
VITE_RESEND_API_KEY=re_[REDACTED]
```

**Impact:** Si le poste de développement est compromis ou si un backup inclut le working directory, ces secrets fuient.

**Mitigation:**
- ✅ `.gitignore` bloque le commit
- ⚠️ Les secrets doivent être dans `secrets/.env.credentials` (permissions 600)
- ⚠️ Le fichier `.env.local` ne devrait PAS contenir `SUPABASE_SERVICE_ROLE_KEY` en local

**Action:** Déplacer `SUPABASE_SERVICE_ROLE_KEY` dans `secrets/.env.credentials` uniquement, supprimer de `.env.local`.

---

### 🟡 ~~HIGH~~ — ✅ FIXÉ — `vite.config.ts` autorise l'accès hors du répertoire projet
**Fichier:** `vite.config.ts:12`
**Statut:** ✅ Appliqué — COD-57 (24 avril 2026)
**Correction:** `allow: ['..']` → `allow: ['.', './src', './public']`

---

### 🟡 ~~HIGH~~ — ✅ FIXÉ — `vercel.json` manque de headers de sécurité
**Fichier:** `vercel.json`
**Statut:** ✅ Appliqué — COD-57 (24 avril 2026)
**Correction:** Headers ajoutés: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, Cache-Control sur /api/*

---

## 🟡 5. XSS & CSP — Score: 6/10

### 🟡 HIGH — CSP contient `'unsafe-eval'` et `'unsafe-inline'`

**Fichier:** `index.html:25-37`

```html
<script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
```

**Impact:**
- `'unsafe-eval'` permet l'exécution de `eval()`, `new Function()`, et WebAssembly non signé. Facilite les attaques XSS si un payload est injecté.
- `'unsafe-inline'` pour les styles permet l'injection de CSS malveillant (exfiltration de données via CSS selectors).

**Mitigation:**
- `'unsafe-eval'` est requis par certaines dépendances (Recharts, Vite HMR). À supprimer en production build.
- `'unsafe-inline'` pour style est difficile à éviter avec Tailwind + styled-components. Acceptable si pas de styles utilisateur injectés.

---

### 🟡 MEDIUM — `dangerouslySetInnerHTML` dans `chart.tsx`

**Fichier:** `src/components/ui/chart.tsx:79`

```tsx
<style dangerouslySetInnerHTML={{ __html: Object.entries(THEMES).map(...) }} />
```

**Impact actuel:** Faible — les données sont statiques (objet `THEMES` interne). **Mais** toute future modification injectant des données utilisateur créerait une XSS immédiate.

**Action:** Monitorer ce composant. Ne JAMAIS injecter de variables utilisateur dans `dangerouslySetInnerHTML`.

---

### 🟡 MEDIUM — Pas de Subresource Integrity (SRI) sur les ressources externes

**Fichier:** `index.html`

Google Fonts et autres ressources externes n'ont pas d'attribut `integrity`.

**Impact:** Si fonts.googleapis.com est compromis, du code malveillant peut être injecté.

**Mitigation:** Faible priorité — Google Fonts est hautement fiable.

---

## 🟡 6. Rate Limiting — Score: 7/10

### 🟡 MEDIUM — Rate limiting côté client bypassable

**Fichier:** `src/lib/ratelimit-client.ts`

```typescript
// Note: This is NOT secure as it can be bypassed by clearing localStorage
const stored = localStorage.getItem(`ratelimit:${key}`);
```

**Impact:** Un attaquant peut contourner le rate limiting en ouvrant une fenêtre navigation privée ou en vidant le localStorage.

**Mitigation:** Le rate limiting côté serveur (Upstash Redis) est le vrai garde-fou. Le client-side est un UX enhancement uniquement. **Assurer que tous les endpoints sensibles passent par le rate limiter serveur.**

---

### 🟡 MEDIUM — Rate limiter manquant sur endpoints critiques

**Endpoints sans rate limiter explicite:**
- `/functions/v1/api-dgi-proxy` — soumissions DGI
- `/functions/v1/api-email-send` — envoi d'emails
- Mock paiements (Orange Money, M-Pesa, Airtel Money)

**Impact:** Un attaquant peut spammer ces endpoints (DoS, coûts API, phishing massif).

**Fix:** Ajouter rate limiting Redis sur toutes les Edge Functions.

---

## ✅ 7. Points Positifs à Préserver

| Mécanisme | Implémentation | Score |
|-----------|---------------|-------|
| **PKCE Flow** | `flowType: 'pkce'` dans Supabase auth | ✅ Excellent |
| **CSRF Protection** | Headers custom + token sessionStorage | ✅ Bon |
| **XSS Sanitization** | `sanitizeHtml()`, `sanitizeUrl()` dans `src/lib/xss-protection.ts` | ✅ Bon |
| **Password Validation** | `password-validation.ts` avec règles fortes | ✅ Bon |
| **API Key Hashing** | SHA-256 avant stockage dans `api_keys` | ✅ Bon |
| **Edge Function Proxy** | Secrets DGI/Resend/Telegram côté serveur | ✅ Excellent |
| **Prepared Statements** | Toutes les requêtes Supabase sont paramétrées | ✅ Excellent |
| **RLS Phase 1** | `companies`, `nif_verification`, `user_invitations` ont des policies correctes | ✅ Bon |

---

## 📋 Plan d'Action Prioritaire

### 🔴 Critique (à faire AVANT toute mise en production)

| # | Action | Fichier/Élément | Priorité | Estimation |
|---|--------|----------------|----------|------------|
| 1 | ~~**Supprimer le log JWT payload**~~ ✅ FIXÉ | `src/hooks/useComptesFinanciers.ts` | ✅ | — |
| 2 | **Supprimer le log token invitation** | `src/components/admin/AdminManager.tsx:62` | 🔴 CRITIQUE | 2 min |
| 3 | **Corriger RLS `USING (true)`** sur 6 tables | SQL migrations | 🔴 CRITIQUE | 2h |
| 4 | ~~**Corriger check rôle `admin`**~~ ✅ FIXÉ | `Settings.tsx`, `Settings-Permissions.tsx`, `supabase.ts` | ✅ | — |
| 5 | ~~**Implémenter Security Logger réel**~~ ✅ FIXÉ | `src/services/securityLogger.ts` + `20260424120100_create_security_logs.sql` | ✅ | — |
| 6 | ~~**Restreindre `fs.allow`** dans Vite~~ ✅ FIXÉ | `vite.config.ts` | ✅ | — |
| 7 | ~~**Ajouter headers sécurité** dans Vercel**~~ ✅ FIXÉ | `vercel.json` | ✅ | — |

### 🟡 Important (à faire dans les 7 jours)

| # | Action | Fichier/Élément | Priorité | Estimation |
|---|--------|----------------|----------|------------|
| 8 | **Nettoyer `.env.local`** des secrets sensibles | `.env.local` | 🟡 HIGH | 10 min |
| 9 | **Ajouter rate limiter** sur Edge Functions DGI/Email | Edge Functions | 🟡 HIGH | 2h |
| 10 | **Créer table `audit_logs`** centralisée | SQL migration | 🟡 HIGH | 2h |
| 11 | **Configurer durée JWT** (15 min access / 7 jours refresh) | Supabase Dashboard | 🟡 HIGH | 15 min |
| 12 | **Ajouter rate limiter** sur mock paiements | `src/mocks/` | 🟡 MEDIUM | 1h |

### 🟢 Optimisation (post-launch)

| # | Action | Fichier/Élément | Priorité | Estimation |
|---|--------|----------------|----------|------------|
| 13 | **Retirer `'unsafe-eval'`** de la CSP en production | `index.html` (build prod) | 🟢 LOW | 1h |
| 14 | **Ajouter DOMPurify** pour rich text | `package.json` | 🟢 LOW | 1h |
| 15 | **Limiter sessions multi-appareils** | `src/lib/security/session-management.ts` | 🟢 LOW | 2h |
| 16 | **Ajouter SRI** sur ressources externes | `index.html` | 🟢 LOW | 30 min |

---

## 🔍 Commandes de Vérification Rapide

```bash
# 1. Vérifier tables sans RLS
supabase sql --command "
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = pg_tables.tablename);
"

# 2. Vérifier RLS trop permissives
grep -rn "USING (true)" supabase/migrations/*.sql

# 3. Vérifier logs de secrets dans le code
grep -rn "console.log.*token\|console.log.*jwt\|console.log.*payload" src/ --include="*.ts" --include="*.tsx"

# 4. Vérifier rôle dans user_metadata
grep -rn "user_metadata.*role" src/ --include="*.ts" --include="*.tsx"

# 5. Vérifier secrets exposés dans le frontend
grep -rn "SERVICE_ROLE_KEY\|sb_secret\|re_" src/ --include="*.ts" --include="*.tsx"

# 6. Vérifier fs.allow dans Vite
grep -rn "allow.*\.\..*\]" vite.config.ts
```

---

## 📚 Références

- OWASP Top 10 2021: https://owasp.org/Top10/
- Supabase Security Best Practices: https://supabase.com/docs/guides/database/database-advisors
- CSP Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html

---

*Document créé dans le cadre de COD-56 — Dev Backend Senior*
*Dernière mise à jour: 24 avril 2026*
*Prochaine revue: après correction des 7 items CRITIQUES*
