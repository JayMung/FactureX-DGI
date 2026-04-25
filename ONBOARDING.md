# Onboarding — FactureSmart

Bienvenue dans l'équipe **FactureSmart**. Ce guide te permet de cloner, configurer et lancer le projet localement, puis de soumettre ta première Pull Request.

> Pour les conventions Git, branches et reviews : voir [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md).

---

## 1. Contexte rapide

- **Produit** : SaaS de facturation conforme DGI (RDC) avec paiement Mobile Money.
- **Stack** : React 18 + Vite + TypeScript + Tailwind CSS + Supabase (Postgres + Auth + Edge Functions) + TanStack Query.
- **PWA** activée via `vite-plugin-pwa`.
- **Repo** : <https://github.com/JayMung/FactureSmart>
- **Branche par défaut** : `main` (protégée — pas de push direct).

---

## 2. Prérequis

| Outil       | Version recommandée |
|-------------|---------------------|
| Node.js     | `20.x` (LTS)        |
| npm         | `10.x` (livré avec Node 20) |
| Git         | `2.40+`             |
| Compte GitHub | Avec accès collaborateur sur le repo |

> ℹ️ Le repo contient à la fois `package-lock.json` et `pnpm-lock.yaml`. **On utilise `npm`** pour la cohérence avec la CI. Ignorer `pnpm-lock.yaml`.

---

## 3. Cloner le projet

```bash
git clone https://github.com/JayMung/FactureSmart.git
cd FactureSmart
```

> Tu n'as pas besoin de fork si tu es collaborateur direct du repo. Le ruleset GitHub force le passage par PR de toute façon.

---

## 4. Configurer l'environnement

### 4.1 Créer ton `.env`

```bash
cp .env.example .env
```

Puis remplis les variables. **Demande les credentials à Jay** (Supabase, Upstash, Resend, OAuth, DGI sandbox, etc.) — ils ne sont **jamais** commités dans le repo.

Variables minimales pour faire tourner l'app en local :

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_APP_URL=http://localhost:5173
VITE_APP_VERSION=dev
```

Les autres (Telegram, OAuth, DGI, Mobile Money) sont nécessaires uniquement pour les features qui les utilisent.

### 4.2 Supabase local (optionnel)

Si tu veux taper sur la base Supabase locale (au lieu du cloud) :

- L'instance VPS de dev tourne sur `100.77.106.28`, ports `54321/54322/54323`.
- Migrations dans `supabase/migrations/`.
- Demander l'URL + anon key locale à Jay.

---

## 5. Installer et lancer

```bash
npm install
npm run dev
```

L'app démarre sur <http://localhost:5173>.

### Scripts utiles

| Script                 | Effet                                                    |
|------------------------|----------------------------------------------------------|
| `npm run dev`          | Dev server Vite avec HMR                                 |
| `npm run build`        | Build production dans `dist/`                            |
| `npm run preview`      | Servir le build de prod localement                       |
| `npm run lint`         | ESLint sur tout le projet                                |
| `npm run test`         | Vitest en mode watch                                     |
| `npm run test:run`     | Vitest en CI (one-shot)                                  |
| `npm run test:ui`      | Vitest UI                                                |
| `npm run test:security`| Tests des validations financières critiques              |
| `npx tsc --noEmit -p tsconfig.app.json` | Type-check sans build              |

---

## 6. Soumettre ta première Pull Request

```bash
# 1. Partir d'un main à jour
git checkout main
git pull origin main

# 2. Créer une branche dédiée
git checkout -b feature/ma-premiere-tache

# 3. Coder, tester localement
npm run test:run
npm run build

# 4. Committer (format Conventional Commits)
git add .
git commit -m "feat(scope): description courte"

# 5. Pousser et ouvrir la PR
git push -u origin feature/ma-premiere-tache
```

GitHub renvoie un lien dans le terminal pour ouvrir la PR. Le **template de PR** se remplit automatiquement — complète-le.

### Ce qui sera vérifié

- ✅ La CI GitHub Actions doit être verte (install + type-check + build)
- ✅ 1 approval (Jay) requis
- ✅ Tâche Multica liée
- ✅ Aucun secret dans le diff

Détails complets : [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md).

---

## 7. Coordination avec Kimi (Multica)

- **Kimi** = agent IA CEO qui dispatche les tâches via **Multica**.
- Toutes les tâches viennent de Multica, pas des issues GitHub.
- Kimi n'a **pas de compte GitHub** : ne pas chercher à le tagger en review.
- Toute PR mentionne sa tâche Multica dans la description.

---

## 8. Structure du repo (vue rapide)

```
FactureSmart/
├── .github/                # Workflows CI, templates PR, guide contribution
├── docs/                   # Documentation produit / technique
├── mockups-v2/             # Maquettes HTML de référence (ne pas les modifier)
├── public/                 # Assets statiques servis tels quels
├── scripts/                # Scripts utilitaires
├── src/                    # Code source React/TS
├── supabase/               # Migrations + Edge Functions
├── tests/                  # Tests Vitest (sécurité financière, etc.)
├── .env.example            # Template des variables d'env (toujours à jour)
├── package.json
├── tsconfig.*.json
└── vite.config.ts
```

> ⚠️ **Attention** : la racine contient encore des fichiers résiduels (`buckydrop-*`, `scrape_leads*`, screenshots) hérités de l'ancien projet. **Ne pas les utiliser comme référence** ; un cleanup est planifié dans une PR séparée.

---

## 9. Problèmes courants

| Symptôme                                         | Solution                                                       |
|--------------------------------------------------|----------------------------------------------------------------|
| `Missing env variable VITE_SUPABASE_URL`         | `.env` non créé / mal rempli — voir §4.1                       |
| Type errors au build mais pas en dev             | Lance `npx tsc --noEmit -p tsconfig.app.json` pour la liste    |
| `npm install` échoue                             | Supprimer `node_modules` + `package-lock.json` puis réinstaller |
| Push refusé sur `main`                           | Normal : `main` est protégé, créer une branche + PR             |
| CI rouge sur la PR                               | Cliquer sur le check, lire les logs, corriger en local           |

---

## 10. Contacts

- **Jay** (owner / reviewer) — via Multica
- **Kimi** (agent IA CEO) — via Multica
- Pas de canal Slack / Discord pour le moment.

Bonne chance, et **ouvre une PR petite et lisible** plutôt qu'une grosse 🙏.
