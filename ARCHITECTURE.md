# 📐 ARCHITECTURE DEDCO — Documentation complète

## 1. Vue d'ensemble

Dedco est une **marketplace béninoise d'aménagement intérieur** qui connecte clients, artisans, designers et maisons de décoration. Le projet se compose de deux versants :

| Versant | Technologie | Repo | URL |
|---------|-------------|------|-----|
| **Site web** | Next.js 16 + TypeScript + Tailwind + shadcn/ui | https://github.com/Golden-003/Dedco | https://dedco-app.vercel.app |
| **App mobile native** | React Native + Expo + Supabase | https://github.com/Golden-003/dedco-app-native | En développement |

### Architecture globale
```
┌─────────────────────────────────────────────────┐
│                   DEDCO                         │
├──────────────────┬──────────────────────────────┤
│   SITE WEB       │       APP MOBILE             │
│   Next.js 16     │       React Native + Expo    │
│                  │                              │
│  ┌────────────┐  │  ┌────────────┐              │
│  │  Frontend  │  │  │  Frontend  │              │
│  │  React SPA │  │  │  RN + Expo │              │
│  └──────┬─────┘  │  └──────┬─────┘              │
│         │        │         │                    │
│  ┌──────▼─────┐  │  ┌──────▼─────┐              │
│  │   Zustand  │  │  │ TanStack   │              │
│  │   Store    │  │  │ Query+Zustand              │
│  └──────┬─────┘  │  └──────┬─────┘              │
│         │        │         │                    │
│  ┌──────▼─────┐  │  ┌──────▼─────┐              │
│  │  Prisma    │  │  │  Supabase  │              │
│  │  + SQLite  │  │  │ PostgreSQL │              │
│  └────────────┘  │  └────────────┘              │
└──────────────────┴──────────────────────────────┘
         │                        │
         ▼                        ▼
   ┌──────────┐           ┌──────────┐
   │  Vercel  │           │  Supabase│
   │  Deploy  │           │  Cloud   │
   └──────────┘           └──────────┘
```

---

## 2. Architecture du Site Web (Next.js)

### 2.1 Stack technique
| Domaine | Technologie |
|---------|-------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Langage | TypeScript 5 |
| Style | Tailwind CSS 4 + CSS variables |
| UI primitives | shadcn/ui (Radix UI) |
| State | Zustand (store global + routing SPA + persist) |
| Animations | Framer Motion |
| Icônes | Lucide React |
| Polices | Quache (display) + Plus Jakarta Sans (corps) |
| DB | Prisma + SQLite (dev), PostgreSQL (prod) |
| Build | Turbopack (dev), Webpack (prod) |

### 2.2 Structure des dossiers
```
src/
├── app/
│   ├── page.tsx                    # Root SPA (Zustand routing, hydratation)
│   ├── layout.tsx                  # Layout global (fonts, metadata)
│   └── globals.css                 # Design system complet (tokens + composants)
├── components/
│   ├── dedco/
│   │   ├── layout.tsx              # Navbar, BottomNav, Footer, UserMenu
│   │   ├── dedco-router.tsx        # Router SPA (switch sur route.page)
│   │   ├── home-page.tsx           # Accueil (hero + search + sections)
│   │   ├── marketplace-page.tsx    # Catalogue produits + filtres
│   │   ├── product-page.tsx        # Fiche produit
│   │   ├── scene-page.tsx          # Scène "Shop the Look" + hotspots
│   │   ├── other-pages.tsx         # Inspirations, Designers, ArtisanDetail
│   │   ├── cart-search.tsx         # CartSidebar + SearchOverlay
│   │   ├── cards.tsx               # ProductCard, SceneCard, ArtisanCard
│   │   ├── brief-page.tsx          # Brief artisan/designer
│   │   ├── phone-input.tsx         # Input téléphone +229 Bénin
│   │   ├── welcome-popup.tsx       # Cookie banner
│   │   └── pages/
│   │       ├── login-page.tsx
│   │       ├── register-page.tsx
│   │       ├── checkout-page.tsx
│   │       ├── profile-page.tsx
│   │       ├── order-pages.tsx
│   │       ├── order-tracking-page.tsx
│   │       ├── favorites-page.tsx
│   │       ├── notifications-page.tsx
│   │       ├── settings-page.tsx
│   │       ├── wallet-page.tsx
│   │       ├── litige-page.tsx
│   │       ├── messages-page.tsx
│   │       ├── moodboard-page.tsx
│   │       ├── search-page.tsx
│   │       ├── onboarding-page.tsx
│   │       ├── about-page.tsx
│   │       ├── help-center-page.tsx
│   │       ├── article-page.tsx
│   │       ├── kyc-page.tsx
│   │       ├── cart-page.tsx
│   │       ├── payment-page.tsx
│   │       ├── shared-sidebar.tsx          # Dashboard sidebar (artisan/designer/admin)
│   │       ├── mes-projets-page.tsx        # Projets client
│   │       ├── brief-create-page.tsx
│   │       ├── brief-list-page.tsx
│   │       ├── brief-artisan-detail.tsx
│   │       ├── brief-designer-detail.tsx
│   │       ├── designer-workflow-pages.tsx
│   │       ├── client-and-designer-pages.tsx
│   │       ├── marketplace-category-page.tsx
│   │       ├── become-artisan-page.tsx
│   │       ├── artisans-page.tsx
│   │       ├── maison-dashboard.tsx
│   │       ├── projet-artisan-detail.tsx
│   │       ├── projet-designer-detail.tsx
│   │       ├── projet-paiement-artisan.tsx
│   │       ├── admin/                     # Pages admin
│   │       ├── artisan/                   # Pages artisan dashboard
│   │       ├── designer/                  # Pages designer dashboard
│   │       └── maison/                    # Pages maison déco
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── ui/                                # shadcn/ui primitives
├── hooks/
└── lib/
    ├── store.ts                  # Zustand store (route, cart, currentUser)
    ├── dedco-data.ts             # Données catalogue (produits, artisans, scènes)
    ├── dedco-data-expanded.ts    # Données étendues
    ├── dedco-types.ts            # Types Route
    ├── dedco-status.tsx          # Statuts et transitions
    ├── notification-store.ts     # Notifications Zustand
    ├── review-store.ts           # Avis Zustand
    ├── artisan-brief-store.ts    # Engine brief artisan
    ├── artisan-brief-types.ts
    ├── artisan-brief-mocks.ts
    ├── designer-brief-store.ts   # Engine brief designer
    ├── designer-brief-types.ts
    ├── mes-projets-data.ts       # Données projets client
    ├── db.ts                     # Prisma client
    └── utils.ts
```

### 2.3 Routing
- **100% SPA** via Zustand (`route.page` string)
- Pas de Next.js App Router pour les pages Dedco
- Seule la route `/` existe côté serveur
- `DedcoRouter` switch sur `route.page` et rend la page correspondante
- Routes supportées : home, marketplace, product, scene, inspirations, designers, artisanDetail, designerDetail, magazine, article, about, help, login, register, forgotPassword, profile, settings, wallet, cart, checkout, payment, favorites, notifications, messages, moodboard, search, onboarding, mesProjets, briefCreate, briefList, briefArtisanDetail, briefDesignerDetail, orders, orderTracking, litige, kyc, becomeArtisan, maisonDashboard, admin*, artisan*, designer*

### 2.4 State management
```
Zustand Store (store.ts)
├── route: { page: string, slug?: string, ... }    # Navigation SPA
├── cart: CartItem[]                                 # Panier
├── currentUser: User | null                        # Auth (mock)
├── searchOpen: boolean                              # Search overlay
├── cartOpen: boolean                                # Cart sidebar
├── favorites: Set<number>                          # Favoris
├── savedScenes: Set<string>                        # Scènes sauvegardées
└── (persisted en localStorage)

Stores spécialisés :
├── notification-store.ts    # Notifications in-app
├── review-store.ts          # Avis produits
├── artisan-brief-store.ts   # Workflow brief artisan
└── designer-brief-store.ts  # Workflow brief designer
```

### 2.5 Rôles utilisateurs
| Rôle | Dashboard | Accès |
|------|-----------|-------|
| **Client** | Profil, commandes, projets, favoris | Achat, brief, avis, litige |
| **Artisan** | Dashboard artisan | Produits, commandes, briefs reçus, KYC |
| **Designer** | Dashboard designer | Missions, projets, portfolio |
| **Maison déco** | Dashboard maison | Hybride artisan + designer |
| **Admin** | Dashboard admin | Tout : users, produits, commandes, litiges, contenu |

### 2.6 Workflows principaux

#### Achat
```
Marketplace → Fiche produit → Ajout panier → Checkout
→ Paiement → Confirmation → Tracking → Avis / Litige
```

#### Brief artisan
```
Accueil → "Brief artisan" → Choix type pièce → Détails
→ Budget → Récap → Soumission → Artisans reçoivent → Devis
```

#### Brief designer
```
Accueil → "Designer d'espace" → Choix espace → Style
→ Budget → Récap → Soumission → Designers reçoivent → Propositions
```

---

## 3. Architecture de l'App Mobile (React Native)

### 3.1 Stack technique
| Domaine | Technologie |
|---------|-------------|
| Framework | React Native + Expo SDK 51 |
| Langage | TypeScript 5 |
| Navigation | Expo Router v3 (file-based) |
| State | Zustand + MMKV (local), TanStack Query (serveur) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Paiement | FedaPay (MTN/Moov Money) |
| Icônes | lucide-react-native |
| Polices | Quache (4 weights) + Plus Jakarta Sans |

### 3.2 Backend Supabase

#### Tables (20 au total, toutes vides)
| Table | Usage | RLS |
|-------|-------|-----|
| categories | Navigation marketplace | Public read |
| artisans | Profils artisans | Public read |
| designers | Profils designers | Public read |
| products | Catalogue produits | Public read (active only) |
| product_images | Galerie produit (1-N) | Public read |
| product_reviews | Avis produits | Public read, user insert |
| scenes | Inspirations | Public read |
| scene_hotspots | Points cliquables scène | Public read |
| collections | Bannières home | Public read (active) |
| profiles | Profils utilisateurs | Owner only |
| addresses | Adresses livraison | Owner CRUD |
| payment_methods | MTN/Moov wallets | Owner CRUD |
| favorites | Favoris produits | Owner CRUD |
| orders | Commandes | Owner read |
| order_items | Items commande | Owner read (via order) |
| order_timeline | Tracking étapes | Owner read (via order) |
| disputes | Litiges | Owner read/insert |
| projects | Briefs sur-mesure | Owner CRUD |
| project_messages | Chat projet | Owner read/insert |
| notifications | Notifications in-app | Owner read/update |

#### Trigger
- `on_auth_user_created` : crée automatiquement un profil dans `profiles` quand un user s'inscrit

#### Index de performance
- `idx_products_category`, `idx_products_artisan`, `idx_products_active`
- `idx_favorites_user`, `idx_orders_user`, `idx_order_items_order`
- `idx_notifications_user_unread`, `idx_projects_user`

### 3.3 Navigation (Expo Router)
```
/                                  → redirect
/(splash)/splash                   → Splash animé
/(auth)/login                      → Phone OTP
/(auth)/register                   → Inscription
/(auth)/verify-otp                 → Code OTP
/(auth)/onboarding                 → 3 slides post-inscription
/(app)/home                        → Tab 1 : Accueil
/(app)/inspirations                → Tab 2 : Inspirations
/(app)/inspirations/[sceneId]      → Scène détaillée
/(app)/market                      → Tab 3 : Marché
/(app)/market/[productId]          → Fiche produit
/(app)/projects                    → Tab 4 : Projets
/(app)/projects/brief-choice       → Choix artisan/designer
/(app)/projects/brief-artisan/*    → 4 étapes
/(app)/projects/brief-designer/*   → 4 étapes
/(app)/projects/[projectId]        → Suivi projet
/(app)/account                     → Tab 5 : Compte
/(app)/account/profile             → Édition profil
/(app)/account/orders              → Mes commandes
/(app)/account/orders/[orderId]    → Tracking
/(app)/account/favorites           → Favoris
/(app)/account/reviews             → Mes avis
/(app)/account/addresses           → Adresses
/(app)/account/payments            → MTN/Moov
/(app)/account/notifications       → Notifications
/(app)/account/language            → Langue & devise
/(app)/account/help                → FAQ
/(app)/account/settings            → Paramètres
/(checkout)/cart                   → Panier
/(checkout)/checkout-step1-info    → Infos
/(checkout)/checkout-step2-shipping→ Livraison
/(checkout)/checkout-step3-payment → Paiement FedaPay
/(checkout)/confirmation           → Confirmation
/(checkout)/dispute                → Litige
/(creators)/artisan/[artisanId]    → Profil artisan
/(creators)/designer/[designerId]  → Profil designer
/(chat)/[threadId]                 → Messagerie
```

### 3.4 Paiement FedaPay
```
User → Supabase Edge Function → FedaPay API (server-side)
→ checkout_url → WebBrowser → User paie (MTN/Moov USSD)
→ FedaPay webhook → Supabase Edge Function
→ update orders.status = 'paid' + push notification
→ App poll → redirect confirmation
```

---

## 4. Design System

### 4.1 Palette
```css
--amber:        #BF793B    /* Accent principal */
--amber-dark:   #9A5A1F
--amber-light:  #D4954A
--amber-pale:   #F5E6D3
--terracotta:   #A6442E    /* Contraste, actions destructives */
--forest:       #548C45    /* Validation, succès */
--bg-cream:     #FBF9F5    /* Fond principal */
--bg-warm:      #F4F0E9    /* Fond secondaire */
--bg-card:      #FFFFFF    /* Cards */
--text-1:       #1A1612    /* Texte principal (ink) */
--text-2:       #5C5249    /* Texte secondaire */
--text-3:       #A89E95    /* Texte tertiaire */
--border:       #EDE8DF    /* Bordures hairline */
--border-dark:  #DDD5C8
```

### 4.2 Typographie
| Usage | Police | Poids | Taille |
|-------|--------|-------|--------|
| Display (hero) | Quache-Bold | 700 | 28-42px |
| H1 | Quache-Bold | 700 | 22-26px |
| H2 | Quache-Medium | 500 | 18-20px |
| Corps | Plus Jakarta Sans | 400-500 | 13-15px |
| Caption | Plus Jakarta Sans | 500 | 11-12px |
| Label | Plus Jakarta Sans-SemiBold | 600 | 10px uppercase |
| Prix | Quache-Bold | 700 | 18-24px |

### 4.3 Règles strictes
- **Bordures** : hairline 1px `#EDE8DF`, jamais > 1.5px
- **Ombres** : opacity 0.04-0.07 sur cards, 0.25 sur CTA amber uniquement
- **Radius** : 12px cards, 16px sheets/banners, 999px pills/chips
- **Icônes** : Lucide, stroke 1.5px (général), 2px (CTA importants)
- **Espacements** : système 8pt grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- **Transitions** : 250ms ease (opacity/layout), 200ms (press scale), 400ms (sheet snap)
- **PAS de** : pastilles colorées épaisses avec icônes blanches, dégradés criards, emojis dans l'UI

---

## 5. Prototype HTML (référence visuelle)

Le prototype HTML (`app-simulator.html`, 6300+ lignes) sur https://dedco-app.vercel.app/app-simulator.html sert de **référence pixel-perfect** pour l'app native. Il contient :
- 30 écrans finalisés
- DA complète (palette, typo, icônes, animations)
- Tous les workflows (achat, brief, favoris, compte)
- Splash screen animé
- Bottom sheets, tap feedback, transitions

---

## 6. Déploiement

### Site web
- **Vercel** auto-deploy sur push `main`
- URL : https://dedco-app.vercel.app
- Build : `npm run build` (Next.js standalone)

### App mobile
- **EAS Build** pour iOS + Android
- **TestFlight** (iOS) + **Internal testing** (Play Store)
- **OTA Updates** pour fixes JS
- Environnements : dev (sandbox FedaPay), staging, production

---

## 7. Liens

| Ressource | URL |
|-----------|-----|
| Site web live | https://dedco-app.vercel.app |
| Prototype app mobile | https://dedco-app.vercel.app/app-simulator.html |
| Repo site web | https://github.com/Golden-003/Dedco |
| Repo app native | https://github.com/Golden-003/dedco-app-native |
| Supabase | https://supabase.com/dashboard/project/bbfrmfuzwbrcihxyvblu |
