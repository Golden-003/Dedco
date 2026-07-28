# Dedco — Site Web

**Marketplace béninoise d'aménagement intérieur** — connecte clients, artisans, designers et maisons de décoration.

## Stack

- **Framework** : Next.js 16 (App Router, Turbopack)
- **Langage** : TypeScript 5
- **Style** : Tailwind CSS 4 + CSS variables
- **UI** : shadcn/ui (Radix UI)
- **State** : Zustand
- **Animations** : Framer Motion
- **Icônes** : Lucide React
- **Polices** : Quache (display) + Plus Jakarta Sans (corps)
- **DB** : Prisma + SQLite (dev), PostgreSQL (prod)

## Démarrage

```bash
npm install
npm run dev    # http://localhost:3000
```

## Build

```bash
npm run build
```

## Structure

```
src/
├── app/                    # App Router Next.js
├── components/
│   ├── dedco/              # Composants Dedco (pages, layout, cards)
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # Hooks React
└── lib/
    ├── dedco-data.ts       # Catalogue (produits, artisans, scènes)
    ├── dedco-types.ts      # Types métier
    ├── store.ts            # Store Zustand global
    └── ...                 # Stores spécialisés (brief, notif, review)
public/
├── Quache-*.ttf            # Polices Quache
├── dedco-logos/            # Logos Dedco
└── favicon*                # Favicons
prisma/
└── schema.prisma           # Schéma base de données
```

## Design System

- **Palette** : `--amber: #BF793B`, `--terracotta: #A6442E`, `--forest: #548C45`, `--bg-cream: #FBF9F5`, `--ink: #1A1612`
- **Typo** : Quache (titres, display) + Plus Jakarta Sans (corps, numérique)
- **Icônes** : Lucide React, stroke 1.5-2px
- **Style** : Éditorial minimaliste, bordures hairline, PAS de pastilles colorées épaisses

## Environnement

Créer un fichier `.env` à la racine :
```
DATABASE_URL="file:./dev.db"
```

## Déploiement

Le site est déployé automatiquement sur Vercel à chaque push sur `main`.

## Liens

- **Repo** : https://github.com/Golden-003/Dedco
- **App mobile (prototype)** : https://dedco-app.vercel.app/app-simulator.html
- **Repo app native** : https://github.com/Golden-003/dedco-app-native

## Licence

MIT
