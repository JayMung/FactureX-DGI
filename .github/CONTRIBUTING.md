# Guide de contribution — FactureSmart

Bienvenue. Ce document décrit **comment travailler sur FactureSmart** sans casser le code des autres.

> Pour la mise en route initiale (clone, install, .env, lancer le projet), voir [`ONBOARDING.md`](../ONBOARDING.md) à la racine.

---

## Workflow Git

Le repo est protégé : **personne ne push directement sur `main`**. Toute modification passe par une Pull Request.

### Cycle d'une tâche

```bash
# 1. Se synchroniser avec main
git checkout main
git pull origin main

# 2. Créer une branche dédiée
git checkout -b <type>/<sujet-court>

# 3. Coder, committer (voir convention plus bas)
git add .
git commit -m "feat(invoices): add PDF export"

# 4. Pousser et ouvrir la PR
git push -u origin <type>/<sujet-court>
# → Suivre le lien renvoyé par GitHub pour ouvrir la PR vers main
```

### Convention de nommage des branches

| Préfixe       | Usage                                       | Exemple                              |
|---------------|---------------------------------------------|--------------------------------------|
| `feature/`    | Nouvelle fonctionnalité                     | `feature/invoice-pdf-export`         |
| `fix/`        | Correction de bug                           | `fix/login-redirect-loop`            |
| `chore/`      | Config, CI, deps, refactor non-fonctionnel  | `chore/setup-workflow`               |
| `perf/`       | Optimisation perfs                          | `perf/lazy-load-invoices`            |
| `docs/`       | Documentation                               | `docs/onboarding-update`             |
| `refactor/`   | Refacto sans changement fonctionnel         | `refactor/clients-route-cleanup`     |

### Convention de commit (Conventional Commits)

Format : `<type>(<scope>): <description courte impérative>`

Types acceptés : `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`.

Exemples :

- `feat(auth): add Google OAuth login`
- `fix(invoices): correct total calculation when tax is 0`
- `chore(ci): bump node to 20`

---

## Pull Requests

### Avant d'ouvrir une PR

- ✅ La branche est à jour avec `main` (rebase recommandé)
- ✅ `npm run build` passe
- ✅ `npx tsc --noEmit` passe
- ✅ `npm run test:run` passe
- ✅ Aucun secret / token / cookie commité (revérifier le diff)
- ✅ Le template de PR est rempli (description, tests, checklist)

### Review

- **1 approval requis** (Jay) avant merge.
- **Kimi (agent IA via Multica)** review en parallèle pour cohérence produit / arbitrages — ce n'est pas un reviewer GitHub, mais sa validation Multica fait partie du process.
- Reviews stales (sur d'anciens commits) sont automatiquement dismissed quand de nouveaux commits sont pushés.

### Merge

- Stratégies disponibles : merge / squash / rebase. **Squash** recommandé pour les petites PRs afin de garder l'historique de `main` propre.
- La branche est supprimée après merge.

---

## Process avec Kimi (Multica)

Kimi est l'**agent IA CEO** qui orchestre les tâches via Multica.

- Toute PR doit être rattachée à une **tâche Multica** (renseignée dans le template).
- Une fois la PR mergée, le statut de la tâche est mis à jour côté Multica.
- Kimi n'a **pas de compte GitHub** → pas de ping `@kimi` dans les PRs ; les échanges se font dans Multica.

---

## Style de code

- TypeScript strict (pas de `any` sans justification).
- Composants React fonctionnels + hooks.
- Tailwind CSS pour le styling (pas de CSS modules custom sans raison).
- ESLint configuré ; lancer `npm run lint` avant de pusher.
- Imports : alphabétique, externes avant internes (l'IDE le gère via ESLint).

---

## Tests

- Stack : **Vitest** + **Testing Library**.
- Tests financiers / sécurité critiques : `npm run test:security`.
- Toute logique métier non triviale (calculs, validations, parsers) **doit** être testée.

---

## Sécurité

🔒 **Ne JAMAIS committer** :

- Fichiers `.env*` (sauf `.env.example`)
- Tokens API, clés Supabase service_role, JWT secrets
- Cookies de session (`*.cookies.json`)
- Dumps de base de données

Le `.gitignore` couvre les patterns courants ; en cas de doute, demander avant de committer.

Si un secret est committé par erreur :

1. **Le révoquer immédiatement** côté provider (Supabase, etc.)
2. Ouvrir une issue / pinger Jay
3. Une réécriture d'historique pourra être nécessaire

---

## Questions

Tout passe par Multica. Pas de message direct sur GitHub.
