# 📋 PASSATION PROJET DEDCO

## Ce que tu dois dire au nouvel assistant (copie-colle ceci) :

> "Je travaille sur un projet Dedco qui est déjà bien avancé dans `/home/z/my-project/`. Lis le fichier `/home/z/my-project/HANDOFF.md` pour avoir tout le contexte, l'état actuel du projet, et ce qui a été fait. Ensuite on continue ensemble."

---

## Ce qu'est Dedco

Dedco est une **marketplace béninoise d'artisanat d'aménagement intérieur** — une app Next.js 16 (TypeScript, Tailwind, shadcn/ui, Prisma, Zustand) qui connecte :
- **Clients** : achètent des pièces artisanales, créent des briefs sur-mesure, suivent leurs projets
- **Artisans** : vendent leurs créations, répondent à des briefs, gèrent leur atelier (dashboard dédié)
- **Designers d'espace** : proposent des missions d'aménagement complet (dashboard dédié)
- **Maison déco** : rôle hybride (dashboard dédié)
- **Admin** : gère la plateforme (dashboard dédié)

**Palette officielle** (déjà dans `globals.css`) :
- Amber `#BF793B` — accent principal
- Terracotta `#A6442E` — contraste, ancrage
- Forest `#548C45` — validation, confiance
- Cream `#FFFFFF` / Warm `#FAF8F5` — fonds
- Ink `#1E1813` — texte

**Typo** : Quache (display, fichiers `.ttf` dans `/public/fonts/`) + Plus Jakarta Sans (corps).

---

## État du code

**Stack** : Next.js 16 + Turbopack, TypeScript, Tailwind 4, shadcn/ui, Prisma (SQLite), Zustand (state global + persist), Framer Motion, Radix UI.

**Structure principale** :
```
src/
  app/
    page.tsx              # Root SPA (Zustand routing, hydratation, navbar/footer)
    layout.tsx            # Layout global, fonts, metadata
    globals.css           # Design system complet (tokens + composants + editorial)
  components/dedco/
    layout.tsx            # Navbar, BottomNav, Footer, UserMenu, NotificationBell
    dedco-router.tsx      # Router SPA (switch sur route.page → rend la page)
    home-page.tsx         # Accueil avec hero + search bar + sections
    marketplace-page.tsx  # Catalogue produits + filtres
    product-page.tsx      # Fiche produit
    scene-page.tsx        # Scène "Shop the Look"
    other-pages.tsx       # Inspirations, Designers, DesignerDetail, ArtisanDetail, Magazine
    cart-search.tsx       # CartSidebar + SearchOverlay
    cards.tsx             # ProductCard, SceneCard, ArtisanCard, DesignerCard, etc.
    welcome-popup.tsx     # Cookie banner
    pages/                # Toutes les autres pages (login, register, profile, dashboards, etc.)
      shared-sidebar.tsx  # DashboardSidebar (artisan/designer/admin/maison)
      artisan/            # Pages artisan
      designer/           # Pages designer
      admin/              # Pages admin
      maison/             # Pages maison déco
  lib/
    store.ts              # Zustand store (route, cart, currentUser, etc.)
    dedco-data.ts         # Données mock (PRODUCTS, ARTISANS, SCENES, DESIGNERS, MAGAZINE, CATEGORIES)
    dedco-types.ts        # Types Route, etc.
    notification-store.ts # Notifications Zustand
    review-store.ts       # Avis Zustand
    brief-artisan/        # Engine brief artisan (status, transitions, permissions)
```

**Routing** : 100% interne via Zustand (`route.page` string). Pas de Next.js App Router pour les pages Dedco — seule `/` existe côté serveur, tout le reste est rendu par `DedcoRouter` en SPA.

**Auth** : Mock — `login(user)` met l'user dans Zustand, persisté en localStorage. Pas de vraie backend auth.

---

## Ce qui a été fait dans la session précédente

### 1. Barre de recherche (déplacée et affinée)
- **Hero de l'accueil** (`home-page.tsx`) : ajout d'une barre de recherche principale en pill blanc + bouton "Chercher" amber, bornée `max-w-lg`. Ouvre le `SearchOverlay` via `setSearchOpen(true)`. Chips de recherche rapide (Wax, Bois iroko, Rotin, Bogolan).
- **Navbar** (`layout.tsx`) : ajout prop `showSearch?: boolean`. Bouton recherche masqué sur les écrans inutiles (profile, settings, wallet, kyc, checkout, auth, dashboards, etc.).
- **`page.tsx`** : calcul `showSearch` via whitelist `SEARCH_VISIBLE_PAGES`.
- **Marketplace** (`marketplace-page.tsx`) : search bar limitée à `max-w-2xl` (au lieu de `w-full`).
- **SearchOverlay** (`cart-search.tsx`) : largeur corrigée `w-[calc(100vw-2rem)] max-w-2xl`.

### 2. Design system éditorial (couche ajoutée dans `globals.css`)
Direction artistique : "Magasin Éditorial Artisanal" (j'avais nommé ça "béninois" mais c'était abusif — visuellement c'est juste des points et blocs de couleur reprenant la palette existante, **pas** de motif africain/wax/bogolan réel).

**Nouveaux utilitaires CSS** dans `globals.css` :
- `.dedco-grain` — texture noiseSVG subtile
- `.dedco-motif-band` — bandeau points amber/terracotta/forest
- `.dedco-stripe-band` — bande tricolore en haut de page
- `.dedco-eyebrow` (+ cream) — eyebrow à point terracotta
- `.dedco-page-header` (+ lead, meta) — en-tête de page éditorial
- `.dedco-section` (+ tight, cream, warm, ink) — rythme de sections
- `.dedco-section-header` (+ content, title, supporting, link)
- `.dedco-card-feature` (+ img, body) — carte image-forward
- `.dedco-card-soft` — carte fond warm
- `.dedco-card-stamped` (+ stamp, amber, terra, forest) — carte avec badge
- `.dedco-bignum` — grand chiffre display
- `.dedco-divider-rich` (+ dots) — divider décoratif
- `.dedco-lead` — paragraphe d'intro
- `.dedco-meta-strip` — ligne de méta-info
- `.dedco-quote` — blockquote éditorial
- `.dedco-chip` (+ active, amber) — chip de filtre éditorial
- `.dedco-page-wrap` — wrapper avec stripe band

### 3. Pages refactorisées avec le nouveau pattern
- **InspirationsPage** (`other-pages.tsx`)
- **DesignersPage** (`other-pages.tsx`)
- **MagazinePage** (`other-pages.tsx`)
- **MarketplacePage** (`marketplace-page.tsx`) — en-tête seulement, filtres inchangés
- **ArtisanDetailPage** (`other-pages.tsx`) — cover éditorial stamped + sections alternées
- **AboutPage** (`pages/about-page.tsx`) — refactor complet (hero ink + stats stamped + valeurs stamped)
- **HelpCenterPage** (`pages/help-center-page.tsx`) — refactor complet

### 4. Screenshots
8 captures d'écran dans `/home/z/my-project/download/` :
- `01-home.png`, `01-home-mobile.png`
- `02-marketplace.png`, `03-inspirations.png`, `04-designers.png`
- `05-magazine.png`, `06-about.png`, `07-help-center.png`

---

## Ce qui reste à faire (priorités)

### Haute priorité — UI
1. **ProductPage** (`product-page.tsx`) — pas encore refactorisée avec le pattern éditorial
2. **DesignerDetailPage** (`other-pages.tsx`) — pas encore refactorisée
3. **ScenePage** (`scene-page.tsx`) — pas encore refactorisée
4. **ArticlePage** (`pages/article-page.tsx`) — pas encore refactorisée
5. **Pages auth** (login, register, forgot-password) — design bof
6. **Pages checkout** (cart, checkout, payment) — design bof
7. **ProfilePage** et pages compte client — design bof

### Moyenne priorité — DA
- L'utilisateur a dit que le UI hors hero était "boff" et manquait d'une D.A singulière de déco
- **Attention** : l'utilisateur n'a PAS demandé de DA "béninoise" spécifiquement — c'était mon interprétation. Lui demander ce qu'il veut visuellement avant de pousser plus loin.
- Éviter les commentaires/codes qui évoquent le bogolan/wax/africain si l'utilisateur ne le demande pas — rester neutre.

### Basse priorité
- Le serveur dev meurt par manque de RAM (4GB) après quelques minutes. Le watchdog (`scripts/watchdog.sh`) le relance mais c'est instable.
- Le preview URL public ne marche pas dans cette session (404). L'utilisateur va ouvrir un nouveau chat pour repartir sur un sandbox frais.

---

## Comment lancer le serveur

```bash
cd /home/z/my-project
# Dev mode (plus léger)
/home/z/my-project/node_modules/.bin/next dev -p 3000

# Production mode (plus stable mais gourmand)
bun .next/standalone/server.js  # après `npm run build`
```

Le gateway Caddy tourne déjà en root sur port 81 et proxy vers 3000.

---

## Notes importantes pour le nouvel assistant

1. **L'utilisateur est francophone** — réponds en français, toujours.
2. **Ne fais pas de assumptions sur la DA** — demande avant d'ajouter des motifs culturels/africains.
3. **Le code est intact** dans `/home/z/my-project/` — tu peux le lire et continuer.
4. **Worklog** dans `/home/z/my-project/worklog.md` — historique détaillé des 2 tasks précédentes.
5. **L'utilisateur préfère voir le rendu** avant de valider — utilise le preview URL ou prends des screenshots avec Playwright (`/home/z/my-project/scripts/screenshot.py` et `capture-one-by-one.sh`).
6. **Pour les screenshots** : le serveur meurt par manque de RAM. Utilise le script `scripts/capture-one-by-one.sh` qui redémarre le serveur entre chaque capture.
7. **Ne pas appeler `Complete`** sauf si vraiment nécessaire — ça n'a pas résolu le problème preview dans cette session.

---

## Liens et fichiers clés

- **Code source** : `/home/z/my-project/src/`
- **Design system** : `/home/z/my-project/src/app/globals.css` (lignes 425-875 pour la couche éditoriale)
- **Données mock** : `/home/z/my-project/src/lib/dedco-data.ts`
- **Store Zustand** : `/home/z/my-project/src/lib/store.ts`
- **Screenshots** : `/home/z/my-project/download/`
- **Worklog** : `/home/z/my-project/worklog.md`
- **Scripts** : `/home/z/my-project/scripts/` (watchdog, screenshot, capture)

---

*Bonne continuation !*
