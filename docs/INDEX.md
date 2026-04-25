# 📚 Documentation FactureSmart - Index Complet

Bienvenue dans la documentation complète de FactureSmart. Ce document vous guide vers toutes les ressources disponibles.

---

## 🗂️ Structure de la Documentation

```
docs/
├── 📄 README.md                          # Vue d'ensemble
├── 📄 INDEX.md                           # Ce fichier (index complet)
├── 📄 DOCUMENTATION_ORGANIZATION.md      # Organisation de la doc
│
├── 📁 api/                               # Documentation API REST
│   ├── API_README.md                     # Guide principal API
│   ├── API_GUIDE.md                      # Guide détaillé d'utilisation
│   ├── API_IMPLEMENTATION_GUIDE.md       # Guide d'implémentation
│   ├── API_KEYS_INTERFACE_GUIDE.md       # Interface de gestion des clés
│   ├── API_DEPLOYMENT_SUMMARY.md         # Résumé du déploiement
│   └── API_FINAL_SUMMARY.md              # Résumé final complet
│
├── 📁 webhooks/                          # Documentation Webhooks
│   ├── WEBHOOKS_GUIDE.md                 # Guide principal webhooks
│   ├── WEBHOOKS_IMPLEMENTATION_COMPLETE.md # Implémentation complète
│   ├── WEBHOOKS_ENRICHMENT_SUMMARY.md    # Enrichissement des données
│   └── WEBHOOK_DELETE_EVENTS.md          # Événements de suppression
│
├── 📁 integrations/                      # Intégrations tierces
│   ├── DISCORD_CHANNELS_SETUP.md         # Configuration Discord
│   └── N8N_INTEGRATION_GUIDE.md          # Intégration n8n
│
├── 📁 notifications/                     # Hub Notifications 🔔 (NOUVEAU)
│   └── NOTIFICATION_HUB_GUIDE.md         # Guide complet notifications push
│
├── 📁 dgi/                               # Conformité DGI 🇨🇩 (NOUVEAU)
│   ├── DGI_OVERVIEW.md                   # Vue d'ensemble conformité
│   └── DGI_TECHNICAL_DOCUMENTATION.md    # Documentation technique DGI
│
├── 📁 auth/                              # Auth & Onboarding (NOUVEAU)
│   └── AUTH_ONBOARDING_GUIDE.md          # Auth, RBAC, Setup Wizard
│
├── 📁 security/                          # Sécurité
├── 📁 permissions/                       # Système de permissions
├── 📁 features/                          # Fonctionnalités
├── 📁 guides/                            # Guides utilisateur
├── 📁 implementation/                    # Guides d'implémentation
├── 📁 technical/                         # Documentation technique
├── 📁 fixes/                             # Corrections de bugs
├── 📁 changelogs/                        # Historique des changements
├── 📁 releases/                          # Notes de version
├── 📁 summaries/                         # Résumés
├── 📁 statistics/                        # Statistiques
├── 📁 optimizations/                     # Optimisations
├── 📁 troubleshooting/                   # Dépannage
├── 📁 recruitment/                       # Recrutement / Briefs
└── 📁 archive/                           # Archives
```

---

## 🚀 Démarrage Rapide

### Pour les Développeurs

1. **API REST** : Commencez par [`api/API_README.md`](./api/API_README.md)
2. **Webhooks** : Consultez [`webhooks/WEBHOOKS_GUIDE.md`](./webhooks/WEBHOOKS_GUIDE.md)
3. **Sécurité** : Lisez [`security/`](./security/)
4. **Notifications Push** : [`notifications/NOTIFICATION_HUB_GUIDE.md`](./notifications/NOTIFICATION_HUB_GUIDE.md)
5. **DGI Compliance** : [`dgi/DGI_OVERVIEW.md`](./dgi/DGI_OVERVIEW.md)

### Pour les Utilisateurs

1. **Guide d'utilisation** : [`guides/`](./guides/)
2. **Configuration Discord** : [`integrations/DISCORD_CHANNELS_SETUP.md`](./integrations/DISCORD_CHANNELS_SETUP.md)
3. **Permissions** : [`permissions/`](./permissions/)
4. **Onboarding** : [`auth/AUTH_ONBOARDING_GUIDE.md`](./auth/AUTH_ONBOARDING_GUIDE.md)

### Nouveautés (Avril 2026)

- 🔔 **Notification Hub** — Centre de notifications, Service Worker PWA, push
- 🇨🇩 **DGI Compliance** — API proxy, soumission/validation conforme
- 🔐 **Auth & Onboarding** — Nouveau login, register, Setup Wizard, RBAC
- 📄 **Devis** — Pages devis, aperçu impression
- 📥 **Import CSV** — Import clients, transactions, rapport
- 🎨 **Mockups v2** — 50+ maquettes haute-fidélité (Design System Emerald)

---

## 📖 Documentation par Catégorie

### 🔌 API REST

**Documentation principale** :
- [`API_README.md`](./api/API_README.md) - Vue d'ensemble et démarrage rapide
- [`API_GUIDE.md`](./api/API_GUIDE.md) - Guide complet d'utilisation
- [`API_IMPLEMENTATION_GUIDE.md`](./api/API_IMPLEMENTATION_GUIDE.md) - Implémentation technique

**Gestion des clés** :
- [`API_KEYS_INTERFACE_GUIDE.md`](./api/API_KEYS_INTERFACE_GUIDE.md) - Interface de gestion

**Déploiement** :
- [`API_DEPLOYMENT_SUMMARY.md`](./api/API_DEPLOYMENT_SUMMARY.md) - Résumé du déploiement
- [`API_FINAL_SUMMARY.md`](./api/API_FINAL_SUMMARY.md) - Résumé final complet

**Endpoints disponibles** :
- `/api/clients` - Gestion des clients
- `/api/factures` - Gestion des factures
- `/api/transactions` - Gestion des transactions
- `/api/colis` - Gestion des colis
- `/api/stats` - Statistiques

---

### 🔔 Webhooks

**Documentation principale** :
- [`WEBHOOKS_GUIDE.md`](./webhooks/WEBHOOKS_GUIDE.md) - Guide complet utilisateur
- [`WEBHOOKS_IMPLEMENTATION_COMPLETE.md`](./webhooks/WEBHOOKS_IMPLEMENTATION_COMPLETE.md) - Implémentation technique

**Fonctionnalités avancées** :
- [`WEBHOOKS_ENRICHMENT_SUMMARY.md`](./webhooks/WEBHOOKS_ENRICHMENT_SUMMARY.md) - Enrichissement des données (user info + client)
- [`WEBHOOK_DELETE_EVENTS.md`](./webhooks/WEBHOOK_DELETE_EVENTS.md) - Événements de suppression

**Formats supportés** :
- Discord (embeds)
- Slack (messages)
- n8n (JSON)
- JSON standard

---

### 🔔 Notifications Hub (NOUVEAU)

**Documentation** :
- [`NOTIFICATION_HUB_GUIDE.md`](./notifications/NOTIFICATION_HUB_GUIDE.md) - Guide complet

**Composants** :
- `NotificationCenter` - Centre de notifications (panneau latéral)
- `NotificationCard` - Carte notification individuelle
- `NotificationSettingsTab` - Paramètres par type de notification

**Services** :
- `notificationService.ts` - CRUD notifications (base de données)
- `notificationSender.ts` - Envoi push via Service Worker

**PWA** :
- Service Worker activé (`public/sw.js`)
- Push subscriptions stockées en base
- Manifest PWA (`public/manifest.json`)

---

### 🇨🇩 DGI Compliance (NOUVEAU)

**Documentation** :
- [`DGI_OVERVIEW.md`](./dgi/DGI_OVERVIEW.md) - Vue d'ensemble
- [`DGI_TECHNICAL_DOCUMENTATION.md`](./dgi/DGI_TECHNICAL_DOCUMENTATION.md) - Documentation technique

**Edge Functions** :
- `api-dgi-proxy` - Proxy avec rate limiter
- `api-dgi-submit` - Soumission factures
- `api-dgi-validate` - Validation format
- `mock-dgi-*` - Mock pour développement

**Pages associées** :
- `DgiStatus.tsx` - Suivi statut en temps réel
- Dashboard DGI — Indicateurs conformité

---

### 🔐 Auth & Onboarding (NOUVEAU)

**Documentation** :
- [`AUTH_ONBOARDING_GUIDE.md`](./auth/AUTH_ONBOARDING_GUIDE.md) - Guide complet

**Pages** :
- `Login.tsx` - Connexion redessinée
- `Register.tsx` - Inscription multi-étapes
- `Onboarding.tsx` - Processus onboarding complet
- `SetupWizard.tsx` - Assistant configuration entreprise

**RBAC** :
- Rôles : Super Admin, Admin, Opérateur, Comptable, Déclarant
- `ProtectedRoute.tsx`, `ProtectedRouteEnhanced.tsx`

---

### 🔗 Intégrations

**Discord** :
- [`DISCORD_CHANNELS_SETUP.md`](./integrations/DISCORD_CHANNELS_SETUP.md) - Configuration complète des canaux Discord
  - Structure recommandée (6 canaux)
  - Configuration des webhooks
  - Permissions et organisation

**n8n** :
- [`N8N_INTEGRATION_GUIDE.md`](./integrations/N8N_INTEGRATION_GUIDE.md) - Intégration avec n8n
  - Workflows automatisés
  - Exemples de scénarios
  - Configuration

---

### 🔒 Sécurité

**Documentation disponible dans** [`security/`](./security/) :
- Audit de sécurité (COD-56)
- RLS (Row Level Security)
- Multi-tenancy
- Rate limiting
- CSP (Content Security Policy)
- Authentification et autorisation

---

### 👥 Permissions

**Documentation disponible dans** [`permissions/`](./permissions/) :
- Système de permissions granulaires
- Rôles prédéfinis (Super Admin, Admin, Opérateur, Comptable, Déclarant)
- Permissions par module
- Configuration et gestion

---

### ✨ Fonctionnalités

**Documentation disponible dans** [`features/`](./features/) :
- Génération de factures PDF
- Système de notifications
- Rapports financiers
- Optimisations de performance
- Import CSV (nouveau)
- Devis (nouveau)

---

### 📘 Guides Utilisateur

**Documentation disponible dans** [`guides/`](./guides/) :
- Guides d'utilisation
- Tutoriels pas à pas
- Bonnes pratiques
- FAQ
- DGI API Credentials Access
- Mobile Money Merchant Access
- Migration Guide
- PRD (Product Requirements Document)
- Séparation Transactions / Opérations

---

### 🔧 Documentation Technique

**Documentation disponible dans** [`technical/`](./technical/) :
- Architecture système
- Base de données (SCHEMA_DB_V2)
- Edge Functions
- Hooks React
- Services
- **Nouveau :** Notification Hub, DGI Proxy, Auth/Onboarding

---

### 🐛 Corrections et Dépannage

**Corrections de bugs** : [`fixes/`](./fixes/)
- Historique des corrections
- Solutions aux problèmes connus

**Dépannage** : [`troubleshooting/`](./troubleshooting/)
- Guide de résolution de problèmes
- Erreurs courantes

---

### 📝 Historique et Versions

**Changelogs** : [`changelogs/`](./changelogs/)
- Historique détaillé des modifications

**Releases** : [`releases/`](./releases/)
- Notes de version
- Nouvelles fonctionnalités

---

## 🔍 Recherche Rapide

### Par Fonctionnalité

| Fonctionnalité | Documentation |
|----------------|---------------|
| **API REST** | [`api/API_README.md`](./api/API_README.md) |
| **Webhooks** | [`webhooks/WEBHOOKS_GUIDE.md`](./webhooks/WEBHOOKS_GUIDE.md) |
| **Discord** | [`integrations/DISCORD_CHANNELS_SETUP.md`](./integrations/DISCORD_CHANNELS_SETUP.md) |
| **n8n** | [`integrations/N8N_INTEGRATION_GUIDE.md`](./integrations/N8N_INTEGRATION_GUIDE.md) |
| **Sécurité** | [`security/`](./security/) |
| **Permissions** | [`permissions/`](./permissions/) |
| **Factures PDF** | [`features/FACTURE_PDF_README.md`](./features/FACTURE_PDF_README.md) |
| **Notifications Hub** | [`notifications/NOTIFICATION_HUB_GUIDE.md`](./notifications/NOTIFICATION_HUB_GUIDE.md) |
| **DGI Compliance** | [`dgi/DGI_OVERVIEW.md`](./dgi/DGI_OVERVIEW.md) |
| **Auth & Onboarding** | [`auth/AUTH_ONBOARDING_GUIDE.md`](./auth/AUTH_ONBOARDING_GUIDE.md) |
| **Devis** | [`features/DEVIS_GUIDE.md`](./features/DEVIS_GUIDE.md) |
| **Import CSV** | [`features/IMPORT_CSV_GUIDE.md`](./features/IMPORT_CSV_GUIDE.md) |

### Par Rôle

**Développeur** :
- API REST : [`api/`](./api/)
- Webhooks : [`webhooks/`](./webhooks/)
- Technique : [`technical/`](./technical/)
- Implémentation : [`implementation/`](./implementation/)
- Notifications : [`notifications/`](./notifications/)
- DGI : [`dgi/`](./dgi/)

**Administrateur** :
- Permissions : [`permissions/`](./permissions/)
- Sécurité : [`security/`](./security/)
- Configuration : [`guides/`](./guides/)
- Auth & Onboarding : [`auth/`](./auth/)

**Utilisateur** :
- Guides : [`guides/`](./guides/)
- Intégrations : [`integrations/`](./integrations/)
- FAQ : [`troubleshooting/`](./troubleshooting/)

---

## 📊 Statistiques de la Documentation

| Catégorie | Nombre de fichiers |
|-----------|-------------------|
| API | 6 fichiers |
| Webhooks | 4 fichiers |
| Intégrations | 2 fichiers |
| Notifications | 1 fichier (nouveau) |
| DGI | 2 fichiers (nouveau) |
| Auth | 1 fichier (nouveau) |
| Sécurité | 17 fichiers |
| Permissions | 8 fichiers |
| Features | 6 fichiers |
| Guides | 12 fichiers |
| Technical | 13 fichiers |
| Fixes | 14 fichiers |
| **Total** | **110+ fichiers** |

---

## 🆕 Dernières Mises à Jour

### Avril 2026
- ✅ **Notification Hub** (Phase 7) — Centre de notifications, Service Worker PWA, notifications push
- ✅ **Conformité DGI** (Phase 3) — API proxy avec rate limiter, soumission/validation, mock DGI
- ✅ **Auth & Onboarding** — Login/Register redesign, Onboarding, Setup Wizard, RBAC
- ✅ **Devis** — Pages devis, aperçu impression
- ✅ **Import CSV** — Import clients, transactions, rapport
- ✅ **Design System v2** — 50+ maquettes haute-fidélité (Mockups v2, Emerald glassmorphism)
- ✅ **Comptabilité OHADA** — Plan comptable, bilan, compte de résultat
- ✅ **Sécurité** — Fix COD-56 : XSS, CSRF, rate limiting, audit RBAC

### 13 novembre 2025
- ✅ API REST complète (6 endpoints)
- ✅ Système de webhooks avec enrichissement
- ✅ Support des événements de suppression
- ✅ Guide d'organisation Discord
- ✅ Intégration n8n
- ✅ Documentation complète (12 nouveaux fichiers)

---

## 🤝 Contribution

Pour contribuer à la documentation :
1. Suivre la structure existante
2. Utiliser le format Markdown
3. Ajouter des exemples concrets
4. Mettre à jour cet index

---

## 📞 Support

Pour toute question :
- Consulter [`troubleshooting/`](./troubleshooting/)
- Vérifier [`fixes/`](./fixes/) pour les problèmes connus
- Contacter l'équipe de développement

---

**Dernière mise à jour** : Avril 2026  
**Version** : 2.1  
**Statut** : ✅ À jour
