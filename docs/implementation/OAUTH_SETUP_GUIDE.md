# OAuth Setup Guide — FactureSmart Sprint 1

**Date** : 23 Avril 2026
**Status** : À faire — Deadline : fin de semaine

---

## 1. Google OAuth (GCP Console)

### Étape 1 : Créer un projet GCP

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créer un nouveau projet : `FactureSmart-Production`
3. Activer les APIs nécessaires :
   - **Google+ API**
   - **OAuth2 API**

### Étape 2 : Configurer l'écran OAuth

1. **APIs & Services** → **OAuth consent screen**
2. Choisir **External**
3. Remplir :
   - App name : `FactureSmart`
   - Email support : `support@facturex.io`
   - Logo (upload : 128x128px)
4. Scopes : `email`, `profile`, `openid`
5. Ajouter utilisateurs de test (émails team)

### Étape 3 : Créer les identifiants OAuth

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID**
3. Application type : **Web application**
4. Authorized redirect URIs :
   ```
   https://[YOUR-PROJECT].supabase.co/auth/v1/callback
   https://[YOUR-PROJECT].supabase.co/auth/callback
   ```
5. Copier **Client ID** et **Client Secret**

### Étape 4 : Configurer dans Supabase

```bash
# Dans le dashboard Supabase → Authentication → Providers → Google
Client ID: [YOUR_GCP_CLIENT_ID]
Client Secret: [YOUR_GCP_CLIENT_SECRET]
```

---

## 2. Microsoft OAuth (Azure AD)

### Étape 1 : Créer une app Azure AD

1. Aller sur [portal.azure.com](https://portal.azure.com)
2. **Azure Active Directory** → **App registrations** → **New registration**
3. Remplir :
   - Name : `FactureSmart`
   - Supported account types : `Accounts in this organizational directory only` (pourdev) / `Accounts in any organizational directory` (prod)
   - Redirect URI : `Web` → `https://[YOUR-PROJECT].supabase.co/auth/v1/callback`

### Étape 2 : Configurer les permissions

1. **API permissions** → **Add a permission**
2. Ajouter : `Microsoft Graph` → `User.Read`
3. **Grant admin consent** (pour le tenant)

### Étape 3 : Créer le secret client

1. **Certificates & secrets** → **New client secret**
2. Copier le **Value** (pas le Secret ID)

### Étape 4 : Récupérer l'Application (client) ID

1. **Overview** → copier **Application (client) ID**
2. **Directory (tenant) ID** → aussi copier

### Étape 5 : Configurer dans Supabase

```bash
# Dans le dashboard Supabase → Authentication → Providers → Microsoft
Client ID: [AZURE_CLIENT_ID]
Client Secret: [AZURE_CLIENT_SECRET]
Tenant ID: [AZURE_TENANT_ID]  # laisser vide pour "common"
```

---

## 3. Variables d'environnement à ajouter

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
VITE_MICROSOFT_TENANT_ID=your_microsoft_tenant_id

# OAuth redirect (doit matcher Supabase)
VITE_OAUTH_REDIRECT=https://your-project.supabase.co
```

---

## 4. Tests OAuth

### Test en local (dev)

```typescript
// Dans supabase client, ajouter :
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin + '/auth/callback'
  }
})
```

### URLs de test

```
http://localhost:5173/login  → Test login Google
http://localhost:5173/login  → Test login Microsoft
```

---

## 5. Troubleshooting OAuth

| Erreur | Solution |
|--------|----------|
| `redirect_uri_mismatch` | Vérifier URI dans GCP/Azure = exactly matching Supabase callback |
| `OAuth 401` | Client secret incorrect |
| `popup blocked` | Utiliser `window.location.href` au lieu de popup |

---

*Guide OAuth FactureSmart Sprint 1 — 23 Avril 2026*
