# FactureX — Design System v3
## Référence visuelle : coccinelledrc.com

---

## 🎨 Palette de couleurs

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Dominante | `emerald-600` | `#059669` | Boutons primary, liens actifs, accents |
| Light | `emerald-500` | `#10b981` | Hover states, badges succès |
| Very light | `emerald-50` | `#ecfdf5` | Badges fond léger, backgrounds |
| Fond global | `slate-50` | `#f8fafc` | Background page |
| Fond header glass | white 85% | rgba(255,255,255,0.85) | Header glassmorphism |
| Texte principal | `slate-800` | `#1e293b` | Titres, corps |
| Texte secondaire | `slate-600` | `#475569` | Labels, descriptions |
| Texte muted | `slate-400` | `#94a3b8` | Placeholders, hints |
| Bordures | `slate-200` | `#e2e8f0` | Cards borders |
| Blob 1 | `emerald-300` | `#6ee7b7` | Background blob |
| Blob 2 | `lime-300` | `#bef264` | Background blob |
| Blob 3 | `teal-100` | `#ccfbf1` | Background blob |
| Succès | `emerald-500` | `#10b981` | Statuts validés |
| Warning | `amber-500` | `#f59e0b` | Statuts en attente |
| Danger | `red-500` | `#ef4444` | Statuts rejetés, erreurs |
| Info | `sky-500` | `#0ea5e9` | Statuts info |

---

## ✒️ Typographie

- **Font family** : `Manrope` (Google Fonts)
- **Weights** : 300 (light), 400 (regular), 600 (semibold), 700 (bold), 800 (extrabold)
- **Corps** : `text-slate-800`, `text-base` / `text-sm`
- **Titres h1** : `text-3xl font-extrabold text-slate-900`
- **Titres h2** : `text-2xl font-bold text-slate-800`
- **Titres h3** : `text-xl font-semibold text-slate-800`
- **Labels** : `text-sm font-semibold text-slate-600`
- **Mono** (numéros facture) : `font-mono text-sm`

---

## 🧊 Glassmorphism

```css
.glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}
```

Header : `fixed w-full top-0 z-50 glass`

---

## 🫧 Blobs animés (arrière-plan)

```css
.blob {
  position: absolute;
  filter: blur(80px);
  z-index: -1;
  opacity: 0.4;
  animation: move 10s infinite alternate;
}
@keyframes move {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(20px, -20px) scale(1.1); }
}
```

3 blobs en `position: absolute` sur le body ou hero :
- `bg-emerald-300 w-96 h-96 rounded-full top-0 left-0 mix-blend-multiply`
- `bg-lime-300 w-96 h-96 rounded-full top-0 right-0 mix-blend-multiply`
- `bg-teal-100 w-96 h-96 rounded-full bottom-0 left-20 mix-blend-multiply`

---

## 🃏 Cards

```html
<div class="bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 p-6">
```

Hover lift :
```css
.hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
.hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
```

---

## 🔘 Boutons

**Primary** :
```html
<button class="px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-lg hover-lift">
```

**Secondary** :
```html
<button class="px-6 py-3 rounded-full bg-white text-slate-700 font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition">
```

**Ghost** :
```html
<a class="text-emerald-600 font-semibold hover:text-emerald-700 transition">
```

---

## 📐 Layout

- Container : `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Header : `fixed`, height ~72px
- Hero/Dashboard content : `pt-24` (躲开header)
- Section spacing : `py-12` à `py-16`

---

## 🗂️ Navigation

Header glass avec logo FactureX à gauche, nav links au centre/droite.
Pas de sidebar lourde — navigation top ou sidebar fine.

---

## 📱 Responsive

- Mobile-first
- Nav hamburger sur mobile
- Cards stack verticalement sur mobile
- `hidden md:flex` pour éléments desktop

---

## 🔤 Badges de statut

- `bg-emerald-50 text-emerald-700` → Validée / Succès
- `bg-amber-50 text-amber-700` → En attente
- `bg-red-50 text-red-700` → Rejetée / Erreur
- `bg-sky-50 text-sky-700` → Brouillon / Info

---

## 🌐 Composition fichier HTML (template)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>... — FactureX</title>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { theme: { extend: { fontFamily: { sans: ['Manrope','sans-serif'] } } } }</script>
  <style>
    body { font-family: 'Manrope', sans-serif; }
    .glass { background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.3); }
    .blob { position: absolute; filter: blur(80px); z-index: -1; opacity: 0.4; animation: move 10s infinite alternate; }
    @keyframes move { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,-20px) scale(1.1); } }
    .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased overflow-x-hidden min-h-screen">
  <!-- Blobs background -->
  <div class="blob bg-emerald-300 w-96 h-96 rounded-full top-0 left-0 mix-blend-multiply"></div>
  <div class="blob bg-lime-300 w-96 h-96 rounded-full top-0 right-0 mix-blend-multiply" style="animation-delay:2s"></div>
  <div class="blob bg-teal-100 w-96 h-96 rounded-full bottom-0 left-20 mix-blend-multiply" style="animation-delay:4s"></div>
  <!-- Content -->
  ...
</body>
</html>
```
