# Design System — FactureX

## 🎨 Vue d'ensemble

Design System pour **FactureX** — SaaS de facturation électronique conforme DGI / RDC.
Design moderne, épuré, professionnel, responsive (desktop + mobile).

---

## 🎯 Principes de design

1. **Clarté** — Interface épurée, informations hiérarchisées
2. **Confiance** — Bleu corporate #10B981 inspire confiance et professionnalisme
3. **Conformité** — Touches RDC (drapeau, carte) discrètes mais présente
4. **Performance** — Feedback immédiat, États de chargement, messages clairs

---

## 🌈 Palette de couleurs

### Couleurs primaires
| Nom | Hex | Usage |
|-----|-----|-------|
| Primary 700 | `#10B981` | Boutons primaires, liens, accents |
| Primary 600 | `#2563EB` | Hover states, éléments actifs |
| Primary 800 | `#1E40AF` | Texte sur fond clair, headers |
| Primary 100 | `#DBEAFE` | Backgrounds, badges légère |
| Primary 50 | `#EFF6FF` | Backgrounds très légers |

### Couleurs fonctionnelles
| Nom | Hex | Usage |
|-----|-----|-------|
| Success 500 | `#10B981` | Statut validée, succès |
| Success 100 | `#DCFCE7` | Background badge succès |
| Warning 500 | `#F59E0B` | En attente, avertissements |
| Warning 100 | `#FEF3C7` | Background badge warning |
| Danger 500 | `#EF4444` | Erreurs, rejets |
| Danger 100 | `#FEE2E2` | Background badge danger |

### Neutres
| Nom | Hex | Usage |
|-----|-----|-------|
| Gray 900 | `#0F172A` | Titres, texte principal |
| Gray 700 | `#334155` | Texte secondaire |
| Gray 500 | `#64748B` | Texte désactivé, placeholders |
| Gray 300 | `#CBD5E1` | Bordures |
| Gray 100 | `#F1F5F9` | Background sections alternées |
| Gray 50 | `#F8FAFC` | Background page |
| White | `#FFFFFF` | Cards, surfaces |

### DRC Touch
| Nom | Hex | Usage |
|-----|-----|-------|
| DRC Blue | `#10B981` | Bandes du drapeau RDC |
| DRC Yellow | `#FFD100` | Bande centrale du drapeau RDC |

**Usage DRC** : Watermark très léger (opacity 3-4%) du drapeau RDC en fond du dashboard.
Jamais de drapeau proéminent. Sobre et professionnel.

---

## ✏️ Typographie

### Police principale
- **Famille** : Inter (Google Fonts)
- **Fallback** : system-ui, sans-serif
- **Usage** : Tout le texte de l'interface

### Hiérarchie
| Style | Taille | Poids | Usage |
|-------|--------|-------|-------|
| Display | 36-48px | 800 | Titres d'écran (H1) |
| H2 | 24px | 700 | Titres de section |
| H3 | 18px | 600 | Sous-sections, titres de cards |
| Body | 14px | 400-500 | Texte courant |
| Body Bold | 14px | 600 | Labels, texte important |
| Caption | 12px | 400 | Texte secondaire, métadonnées |
| Micro | 10-11px | 500-600 | Badges, tags, uppercase labels |

### Mono (codes, NIF, montants)
- **Famille** : JetBrains Mono
- **Usage** : NIF, numéros de facture, montants, logs, codes

---

## 📐 Espacements

Système basé sur **4px grid** :
- `1` = 4px (espacement minuscule)
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `5` = 20px
- `6` = 24px
- `8` = 32px
- `10` = 40px
- `12` = 48px

---

## 🧩 Composants réutilisables

### Boutons

**Primaire**
- Background: `linear-gradient(135deg, #10B981 0%, #1d4ed8 100%)`
- Hover: `linear-gradient(135deg, #00419E 0%, #10B981 100%)`
- Text: Blanc, font-weight 600, text-sm
- Border-radius: 12px (rounded-xl)
- Padding: py-2.5 px-5
- Shadow: `shadow-sm`, hover: `shadow-lg shadow-primary-700/25`

**Secondaire (outline)**
- Background: Blanc
- Border: `border-gray-200`
- Text: `text-gray-700`
- Hover: `hover:bg-gray-50`

**Danger**
- Background: `bg-red-500`, hover: `bg-red-600`

### Cards
- Border-radius: 16px (rounded-2xl)
- Border: `border-gray-100`
- Shadow: `shadow-sm`
- Padding: `p-5` à `p-6`
- Hover (stat cards): `transform: translateY(-2px)` + shadow accrue

### Badges de statut
| Statut | Style |
|--------|-------|
| Validée | `bg-green-50 text-green-700` + dot vert |
| En attente | `bg-orange-50 text-orange-700` + dot orange animé |
| Rejetée | `bg-red-50 text-red-700` + dot rouge |

### Inputs
- Border-radius: 12px (rounded-xl)
- Border: `border-gray-200`
- Focus: `ring-2 ring-primary-100, border-primary-300`
- Padding: `py-2.5 px-4`
- Font: text-sm

### Sidebar
- Width: 256px (w-64)
- Background: Blanc
- Border-right: `border-gray-200`
- Nav item padding: `px-3 py-2.5`
- Nav item radius: `rounded-xl`
- Nav item active: `bg-primary-50 text-primary-700`

### Tables
- Header: `bg-gray-50 border-b border-gray-100`
- Row hover: `hover:bg-gray-50`
- Cell padding: `px-6 py-3.5`
- Row divide: `divide-y divide-gray-50`

### Toggles
- Width: 40-44px, height: 24px
- Border-radius: full
- Off: `bg-gray-300`
- On: `bg-primary-600`
- Thumb: 20px circle, white, shadow

### Icons
- Library: Remix Icon (CDN)
- Size: text-base (16px) pour inline, text-lg (20px) pour standalone
- Color: inherit from parent (currentColor)

---

## 📱 Responsive

- Mobile-first pas encore implémenté (desktop only dans les mockups)
- Sidebar collapse sur mobile (hamburger menu)
- Tables scrollables horizontalement sur mobile
- Cards passent en 1 colonne sur mobile

---

## 🗂️ Structure des fichiers

```
mockups-v2/
├── screen-00-login.html          # Écran 1: Connexion / Inscription
├── screen-01-dashboard.html     # Écran 2: Tableau de bord
├── screen-02-factures.html      # Écran 3: Liste des factures
├── screen-03-creation-facture.html  # Écran 4: Création facture
├── screen-04-preview-facture.html    # Écran 5: Prévisualisation + QR
├── screen-05-dgi-status.html    # Écran 6: Statut transmission DGI
├── screen-06-clients.html       # Écran 7: Gestion des clients
├── screen-07-rapports.html      # Écran 8: Rapports fiscaux
├── screen-08-settings.html       # Écran 9: Paramètres
└── DESIGN_SYSTEM.md             # Ce document
```

---

## 🛠️ Stack technique

- **Tailwind CSS** via CDN (v3, compatible)
- **Google Fonts**: Inter + JetBrains Mono
- **Remix Icon** via CDN
- **Aucun build requis** — fichiers HTML autonomes

---

## 📍 Conformité DGI / RDC

Chaque facture doit inclure :
- [ ] NIF vendeur et acheteur
- [ ] RCCM
- [ ] QR Code (lien vers validation DGI)
- [ ] Code d'authentification DGI
- [ ] Signature numérique (RSA-2048)
- [ ] Montant HT, TVA 18%, TTC
- [ ] Date d'émission
- [ ] Numéro de facture unique (format: FX-YYYY-NNNNN)

---

*Dernière mise à jour : Avril 2026*
*Version : 1.0 — Phase 4 Design Refactoring*
