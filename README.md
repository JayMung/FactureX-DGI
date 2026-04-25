# FactureSmart

**Version** : 2.0  
**Status** : ✅ Production Ready

Application de gestion de factures, clients, transactions, notifications et conformité DGI pour entreprises RDC.

---

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

---

## 📚 Documentation

Toute la documentation technique se trouve dans le dossier `/docs` :

### Guides Principaux
- [Release Notes v1.0.3](docs/RELEASE_NOTES_v1.0.3.md)
- [Release Deployment](docs/RELEASE_v1.0.3_DEPLOYED.md)
- [Finances Permissions Guide](docs/FINANCES_PERMISSIONS_GUIDE.md)

### Documentation Technique
- [TypeScript Resolution](docs/TYPESCRIPT_FINAL_FIX.md)
- [UI Types Solution](docs/UI_TYPES_SOLUTION.md)
- [Security Audit](docs/RAPPORT_AUDIT_SECURITE_FACTUREX.md)

### Fixes & Improvements
- Voir le dossier `/docs/fixes/` pour les corrections spécifiques
- Voir le dossier `/docs/guides/` pour les guides détaillés

---

## 🔧 Technologies

- **Frontend** : React + TypeScript + Vite
- **UI** : TailwindCSS + shadcn/ui + Design System Emerald/Glassmorphism
- **Backend** : Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State Management** : React Query
- **Routing** : React Router v6
- **PWA** : Service Worker (mode SPA offline-ready)
- **PDF** : Puppeteer / react-pdf (factures conformes DGI)

---

## 🔒 Security

- Multi-tenancy avec isolation par organization
- Row Level Security (RLS) sur toutes les tables
- Permissions granulaires par module
- Session management sécurisé
- Rate limiting sur les endpoints critiques

---

## 📦 Modules

- **Clients** : Gestion des clients
- **Factures** : Création et gestion de factures/devis
- **Transactions** : Transactions commerciales
- **Colis** : Gestion des colis aériens
- **Finances** : Module sécurisé (Admin uniquement)
  - Opérations financières
  - Comptes financiers
  - Mouvements de comptes
  - Encaissements
- **Notifications** : Hub centralisé avec service worker push
  - Notifications en temps réel
  - Centre de notifications React
  - Paramètres de notifications par type
  - Push subscriptions (Web Push API)
- **Authentification & Onboarding** :
  - Login/Register redessiné
  - Setup Wizard avec configuration entreprise
  - Processus onboarding complet avec validation DGI
  - Support RBAC (rôles et permissions)
- **DGI Compliance** :
  - API proxy DGI avec rate limiting
  - Soumission et validation de factures conformes
  - Mock DGI pour développement
  - Suivi statut DGI en temps réel
- **Comptabilité OHADA** :
  - Plan comptable
  - Journal, Grand Livre, Balance
  - Compte de résultat, Bilan
  - Trésorerie, Relevé bancaire
  - Export OHADA

---

## 👥 Roles & Permissions

- **Super Admin** : Accès complet
- **Admin** : Gestion complète sauf configuration système
- **Opérateur** : Accès limité (pas de finances, pas de DGI, pas de comptabilité)
- **Comptable** : Lecture seule sur finances (optionnel)
- **Déclarant** : Accès module DGI en lecture/écriture limitée

---

## 🚀 Deployment

L'application est configurée pour un déploiement automatique sur :
- **Vercel** (recommandé)
- **Netlify**

Le déploiement se déclenche automatiquement sur push vers `main`.

---

## 📝 License

Propriétaire - Tous droits réservés

---

## 🤝 Support

Pour toute question ou problème, consultez la documentation dans `/docs` ou contactez l'équipe de développement.

---

**FactureSmart v1.0.3** - Gestion d'entreprise simplifiée ✨
