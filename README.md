# FactureSmart

**Version** : 1.0.3  
**Status** : ✅ Production Ready

Application de gestion de factures, clients, transactions et colis pour entreprises.

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

La documentation technique est en cours de restructuration.
Pour l'instant, référez-vous aux maquettes UI dans `/mockups-v2/` et au code source dans `/src/`.

---

## 🔧 Technologies

- **Frontend** : React + TypeScript + Vite
- **UI** : TailwindCSS + shadcn/ui
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **State Management** : React Query
- **Routing** : React Router v6

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

---

## 👥 Roles & Permissions

- **Super Admin** : Accès complet
- **Admin** : Gestion complète sauf configuration système
- **Opérateur** : Accès limité (pas de finances)
- **Comptable** : Lecture seule sur finances (optionnel)

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

Pour toute question ou problème, contactez l'équipe de développement.

---

**FactureSmart v1.0.3** - Gestion d'entreprise simplifiée ✨
