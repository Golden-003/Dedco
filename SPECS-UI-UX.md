# 🎨 SPECS UI & UX — Dedco

## 1. Direction Artistique

### 1.1 Identité visuelle
Dedco adopte un style **éditorial minimaliste** — inspiré des magazines de décoration haut de gamme (Apartamento, Architectural Digest) adapté au mobile. La DA est **singulière** : elle ne copie pas les codes des marketplaces génériques (Amazon, Jumia) ni les motifs africains stéréotypés (wax, bogolan dans l'UI). Elle s'appuie sur la palette Dedco, la typo Quache, et des compositions image-forward.

### 1.2 Palette
```
AMBER        #BF793B    Accent principal, CTAs, prix
AMBER DARK   #9A5A1F    Hover, texte prix
AMBER PALE   #F5E6D3    Badges, fonds subtils
TERRACOTTA   #A6442E    Déstructif (supprimer, déconnexion), favoris actifs
FOREST       #548C45    Succès, validation, "en stock"
CREAM        #FBF9F5    Fond principal
WARM         #F4F0E9    Fond secondaire, inputs, chips inactifs
INK          #1A1612    Texte principal, boutons primaires
TEXT 2       #5C5249    Texte secondaire
TEXT 3       #A89E95    Texte tertiaire, placeholders
BORDER       #EDE8DF    Bordures hairline
```

### 1.3 Typographie
| Rôle | Police | Poids | Taille | Lettre-spacing | Usage |
|------|--------|-------|--------|----------------|-------|
| Display | Quache-Bold | 700 | 28-42px | -0.03em | Hero, splash, titres majeurs |
| H1 | Quache-Bold | 700 | 22-26px | -0.02em | Titres de page |
| H2 | Quache-Medium | 500 | 18-20px | -0.01em | Titres de section |
| H3 | Quache-Medium | 500 | 16px | -0.01em | Titres de card |
| Body | Plus Jakarta Sans | 400 | 13-15px | 0 | Corps de texte |
| Body Sm | Plus Jakarta Sans | 500 | 11-12px | 0 | Métadonnées, descriptions |
| Label | Plus Jakarta Sans | 600 | 10px | 0.12em uppercase | Eyebrows, labels de champ |
| Caption | Plus Jakarta Sans | 500 | 10-11px | 0 | Dates, counts, hints |
| Price | Quache-Bold | 700 | 14-24px | -0.02em | Prix produits, tabular-nums |

**Règle** : Quache est RÉSERVÉ aux titres/display/prix. Plus Jakarta Sans pour tout le reste. Jamais inverser.

### 1.4 Icônes
- **Bibliothèque** : Lucide React (web) / lucide-react-native (app)
- **Stroke-width** : 1.5px (général), 2px (CTA importants, navigation)
- **Tailles** : 14, 16, 18, 20, 24, 32px
- **Couleur** : monochrome, hérite du contexte (`currentColor`)
- **PAS de** : pastilles circulaires colorées avec icône blanche dedans. Les icônes sont nues sur fond transparent ou bg-warm.
- **Exception** : le logo Dedco "Dedco." est en texte CSS (Quache-Bold + point amber)

### 1.5 Espacements (8pt grid)
```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```
- Screen padding : 16px
- Card padding : 12-14px
- Grid gap : 10-12px
- Section gap : 24-32px

### 1.6 Bordures & ombres
- **Bordures** : 1px solid `#EDE8DF` (hairline). Jamais > 1.5px.
- **Ombres cards** : `0 1px 3px rgba(30,24,19,0.05)` — très subtiles
- **Ombres CTA** : `0 6px 18px rgba(191,121,59,0.25)` — uniquement sur boutons amber
- **Ombres sheets** : `0 -8px 40px rgba(0,0,0,0.18)` — bottom sheets

### 1.7 Radius
| Usage | Radius |
|-------|--------|
| Cards | 12-14px |
| Sheets/banners | 16-20px |
| Chips/pills/badges | 999px (pill) |
| Inputs | 10-12px |
| Avatars | 999px (cercle) |
| Images produits | 0 (carré) ou 12px |

### 1.8 Icônes — Mapping définitif (source de vérité unique)

Toutes les icônes proviennent de **Lucide** (`lucide-react` sur web, `lucide-react-native` sur app). Ci-dessous le mapping officiel — aucune déviation autorisée.

#### Catégories de produits
| Catégorie | Icône Lucide | Slug |
|-----------|-------------|------|
| Tables | `Table2` | tables |
| Fauteuils & Chaises | `Armchair` | fauteuils |
| Luminaires | `Lamp` | luminaires |
| Textiles | `Layers` | textiles |
| Déco | `Frame` | decoration |
| Rangements | `Archive` | rangements |
| Canapés | `Sofa` | canapes |
| Lits | `BedDouble` | lits |

#### Navigation
| Usage | Icône Lucide |
|-------|-------------|
| Accueil (tab) | `Home` |
| Inspirations (tab) | `LayoutGrid` |
| Marché (tab) | `Store` |
| Projets (tab) | `FolderOpen` |
| Compte (tab) | `User` |
| Retour | `ArrowLeft` (chevron `ChevronLeft` sur mobile) |
| Suivant / Chevron | `ChevronRight` |
| Recherche | `Search` |
| Panier | `ShoppingBag` |
| Notifications | `Bell` |
| Menu | `Menu` |

#### Actions
| Usage | Icône Lucide |
|-------|-------------|
| Favori (cœur) | `Heart` |
| Bookmark (scène) | `Bookmark` |
| Partager | `Share2` |
| Ajouter (+) | `Plus` |
| Retirer (−) | `Minus` |
| Fermer (X) | `X` |
| Étoile (rating) | `Star` |
| Modifier (crayon) | `Pencil` (mobile) / `PenSquare` (web) |
| Supprimer | `Trash2` |
| Filtres | `SlidersHorizontal` |
| Trier | `ArrowUpDown` |

#### Trust & statut
| Usage | Icône Lucide |
|-------|-------------|
| Garantie Dedco | `ShieldCheck` |
| Artisan/Designer vérifié | `BadgeCheck` |
| Livraison | `Truck` |
| Localisation | `MapPin` |
| Paiement sécurisé | `Lock` |
| Succès | `CheckCircle2` |
| Alert/Erreur | `AlertTriangle` |
| Information | `HelpCircle` |
| Horloge (délai) | `Clock` |

#### Compte & paramètres
| Usage | Icône Lucide |
|-------|-------------|
| Profil | `User` |
| Commandes | `Package` |
| Avis | `Star` |
| Adresses | `MapPin` |
| Moyens de paiement | `CreditCard` |
| Langue & devise | `Globe` |
| Aide & support | `HelpCircle` |
| Paramètres | `Settings` |
| Déconnexion | `LogOut` |

#### Briefs & projets
| Usage | Icône Lucide |
|-------|-------------|
| Brief artisan | `Hammer` |
| Brief designer | `PencilRuler` (web) / `Pencil` (mobile) |
| Projet | `FolderOpen` |
| Message | `MessageSquare` |

**Règles** :
- Stroke-width : **1.5px** (général), **2px** (CTA, navigation)
- Tailles : 14, 16, 18, 20, 24, 32px
- Couleur : `currentColor` (hérite du parent)
- **PAS de** : `Lightbulb` (utiliser `Lamp`), `Shirt` (utiliser `Layers`), `Flower2` (retiré)
- **PAS de** : pastilles circulaires colorées avec icône blanche dedans

---

## 2. Composants UI

### 2.1 Boutons
| Variant | Style | Usage |
|---------|-------|-------|
| Primary | bg ink, text white, radius 14px, h 48-52px | CTA principal (Se connecter, Payer, Commander) |
| Secondary | bg warm, text ink, radius 14px | CTA secondaire (Retour, Annuler) |
| Ghost | transparent, text text-2 | Liens d'action |
| Danger | text terracotta, pas de bg | Déconnexion, supprimer |
| Amber | bg amber, text white, shadow amber | Bannières projet |
| Pill | bg ink/amber, text white, radius 999px, h 32-36px | Filtres actifs, tags |

**Tap feedback** : `scale(0.96)` + opacity 0.92, durée 100ms

### 2.2 Cards
| Type | Description |
|------|-------------|
| **ProductCard** | Image 1:1 + badge optionnel + favori + nom + rating + prix |
| **SceneCard** | Image 3:4 + overlay gradient + badge room + bookmark + titre + style + meta |
| **ArtisanCard** | Avatar + nom + specialty + level badge + rating |
| **OrderCard** | Numéro + date + statut badge + miniatures empilées + prix |
| **CollectionBanner** | Image 16:9 + overlay + titre + CTA |

### 2.3 Bottom Sheets
- **Handle** : barre 36×4px, bg border-dark, centrée
- **Header** : titre Quache 18px + bouton close 30×30px
- **Body** : scrollable, padding 14-18px
- **Footer** : sticky, bouton "Réinitialiser" + "Appliquer (N)"
- **Animation** : `translateY(100%) → 0`, cubic-bezier(0.32, 0.72, 0, 1), 300ms

### 2.4 Trust Badges
Style éditorial minimaliste (PAS de pastilles colorées) :
- Container : bordure hairline, bg-card, radius 14px, 3 colonnes
- Chaque item : icône Lucide 18px stroke 1.5 (monochrome text-1) + label 9px
- Séparateurs : ligne 1px border entre colonnes

### 2.5 Empty States
- Icône Lucide 48px stroke 1.5 dans cercle bg-warm 96px
- Titre Quache-Medium 16-18px
- Description text-3 12px, max 240px
- CTA optionnel (bouton primary ou pill)

---

## 3. Écrans — Specs détaillées

### 3.1 Splash
- Fond amber uni plein écran
- Logo "Dedco." texte CSS : Quache-Bold 42px blanc + point amber 48px
- 6 icônes Lucide apparaissent séquentiellement à la place du point (Table, Fauteuil, Lampe, Textiles, Canapé, Déco)
- Tagline "L'art de vivre chez soi" fade-in à 1.5s
- Durée totale ~7s → fade out → redirect

### 3.2 Home
- **Header** : greeting "Bonjour, [prénom]" + "Dedco." (point amber) + icônes notification + panier
- **Search pill** : bg warm, icône loupe + input + badge filtres
- **Hero** : carrousel 3-5 bannières (image 16:9 + overlay + titre Quache + meta + CTA)
- **Catégories** : scroll horizontal, pills icône + label
- **Bannières projet** : 2 cards plein width (amber "Brief artisan" + forest "Designer d'espace")
- **Coups de cœur** : grille 2 colonnes ProductCard

### 3.3 Marketplace
- **Header** : titre "Marketplace" Quache 24px + sous-titre count + bouton filtres (badge count rouge si actifs)
- **Pills catégories** : scroll horizontal, état actif en ink
- **Barre tri** : "N résultats" + bouton "Trier: [label] ↓"
- **Recherche** : input live, debounce 300ms
- **Grille** : 2 colonnes, gap 12px, ProductCard compact
- **Infinite scroll** + pull-to-refresh
- **État vide** : "Aucun produit trouvé" + CTA reset filtres

### 3.4 Fiche produit
- **Galerie** : swipe horizontal, aspect 1:1, dots indicator + compteur "1/4"
- **Flèches** : gauche/droite, 36px, backdrop-blur
- **Header flottant** : back + favori + partage
- **Titre** : catégorie (eyebrow amber) + nom Quache 22px
- **Rating** : ★★★★★ + note bold + "· 23 avis" (cliquable, dépliable)
- **Artisan** : avatar 20px + nom + badge N3 (cliquable → profil artisan)
- **Prix** : Quache-Bold 24px, bg-card, radius 14px
- **Description** : dépliable (max 4 lignes + "Lire plus")
- **Finition** : swatches ronds 28px
- **Quantité** : stepper − / 1 / +
- **Specs** : matériaux, dimensions, poids, délai
- **Trust badges** : éditorial 3 colonnes (Garantie, Artisan vérifié, Livraison)
- **Avis** : cachés par défaut, dépliables au tap
- **CTA sticky** : "Ajouter au panier · 145 000 FCFA"

### 3.5 Panier
- Items : image 72px + nom + artisan + couleur + prix + stepper + supprimer
- Résumé : sous-total + total (sans garantie ni livraison)
- Trust bar : "Paiement sécurisé · MTN & Moov Money"
- CTA "Passer commande" plein width

### 3.6 Checkout 3 étapes
- **Étape 1 (Infos)** : nom, prénom, tel, adresse, ville, email optionnel
- **Étape 2 (Livraison)** : standard (gratuite) / express / retrait atelier
- **Étape 3 (Paiement)** : FedaPay + checkbox notif + sommaire
- **Step indicator** : 3 cercles numérotés avec lignes
- **Récap produit** : image 44px + nom + "Quantité: 1" + prix

### 3.7 Confirmation
- Checkmark animé (pop + draw)
- "Commande confirmée" Quache 22px
- Numéro commande
- CTA "Suivre ma commande" + "Continuer mes achats"

### 3.8 Tracking
- Timeline verticale : 5 étapes avec icônes + dates
- CTA "Confirmer réception" → débloque avis
- CTA "Ouvrir un litige"

### 3.9 Inspirations
- **Header éditorial** : "Inspirations" Quache 24px + sous-titre
- **Recherche** : pill warm + input
- **Filtres pièce** : pills scrollables (Pour vous, Salon, Chambre, Bureau, etc.)
- **Scene featured** : première scène en grand, full width
- **Masonry** : grille 2 colonnes SceneCard
- **Bookmarks** : cliquables sur chaque card

### 3.10 Scène détaillée
- Image plein écran avec hotspots cliquables (points amber pulsants)
- Tap hotspot → popup avec produit + prix + "Voir la fiche" + "Ajouter au panier"
- Header flottant : back + bookmark + share
- Hashtags + stats (saves, produits)
- Section "Shop the Look" avec produits

### 3.11 Projets
- **État vide** : EmptyState + processus 4 étapes numérotées + CTA "Démarrer un projet"
- **Avec projets** : onglets (En cours / À choisir / Terminés) + cards projet

### 3.12 Briefs (artisan + designer)
- **Step indicator** : 4 cercles numérotés + lignes de connexion
- **Options** : grille 2 colonnes, tap = sélection ink
- **Champs** : inputs bg-card border hairline, labels uppercase 10px
- **Upload photos** : zone dashed border + icône caméra
- **Navigation** : "Retour" (warm) + "Continuer →" (ink), dernier step = "Envoyer le brief"

### 3.13 Compte
- **Profil** : avatar 64px rond + nom Quache 21px + email + bouton crayon modifier
- **3 sections menu** : Activité / Compte / Préférences
- **Items** : icône monochrome 18px stroke 1.6 + label + count optionnel + chevron droite
- **Déconnexion** : texte terracotta centré, pas de fond
- **Footer** : "Dedco · version 1.0.0"

### 3.14 Artisan / Designer
- **Cover** : image 16:9 + gradient fort + boutons back/share/favori
- **Avatar** : 80px qui chevauche la cover + étoile amber inline
- **Stats** : 3 colonnes bordées hairline (Produits/Note/Avis ou Projets/Note/Expérience)
- **Trust badges** : éditorial 3 colonnes monochromes
- **Sections** : Réalisations/Portfolio + Produits/Services
- **CTA sticky** : "Démarrer un projet" / "Prendre rendez-vous"

### 3.15 Auth
- **Logo** : "Dedco." centré 42px + tagline
- **Phone input** : indicatif 🇧🇯 +229 fixe + input numéro
- **Mot de passe** : avec lien "Oublié ?"
- **Bouton** : "Se connecter" ink plein width
- **Divider** : "ou"
- **Google** : bouton avec logo couleur officielle
- **Inscription** : lien "Pas encore de compte ? S'inscrire"
- **CGU** : texte 10px en bas

---

## 4. Interactions & Animations

### 4.1 Transitions
| Élément | Animation | Durée |
|---------|-----------|-------|
| Écran → écran | fade-in + translateY 4px → 0 | 250ms ease |
| Tap bouton/card | scale 0.96 + opacity 0.92 | 100ms |
| Bottom sheet | translateY 100% → 0 | 300ms cubic-bezier(0.32, 0.72, 0, 1) |
| Favori cœur | scale 1.3 → 1 (spring) | 200ms |
| Checkmark confirmation | pop (scale 0 → 1.2 → 1) + stroke draw | 600ms |
| Splash icônes | opacity 0 → 1 + scale 0.3 → 1 → 0.5 + translateY | 800ms par icône |
| Stagger cards | delay 50ms par card (max 8) | 50ms stagger |

### 4.2 Gestures
- **Swipe horizontal** : galerie produit, hero carrousel
- **Swipe to delete** : notifications, items panier
- **Pull to refresh** : toutes les listes
- **Long press** : product card → quick actions (favori, partager) — v1.5
- **Pinch to zoom** : scène détaillée — v1.5

### 4.3 Haptics
- **Light** : tap sur bouton, chip, tab
- **Medium** : ajout au panier, validation étape
- **Success** : confirmation commande, avis publié
- **Warning** : erreur, litige

---

## 5. Responsive & Platform

### 5.1 Mobile-first
L'app est conçue **mobile-first**. Le site web s'adapte en desktop avec :
- Max-width container 1280px
- Grille produits : 2 colonnes mobile → 4 colonnes desktop
- Navbar desktop horizontale (vs bottom nav mobile)
- Cart sidebar (vs plein écran mobile)

### 5.2 Safe areas
- `env(safe-area-inset-top)` pour le notch
- `env(safe-area-inset-bottom)` pour le home indicator
- Tab bar : 64px + safe area bottom

### 5.3 Performance
- **Images** : expo-image avec cache disk, blur-up placeholder, priority loading
- **Lists** : FlatList (RN) avec windowing, pas de ScrollView pour listes longues
- **Animations** : react-native-reanimated (UI thread, pas JS thread)
- **Bundle** : cible < 5MB JS bundle

---

## 6. Accessibilité

- **VoiceOver/TalkBack** : labels sur tous les éléments interactifs
- **Contraste** : minimum 4.5:1 pour texte, 3:1 pour éléments graphiques
- **Taille police** : support Dynamic Type (iOS) et font scale (Android)
- **Tap targets** : minimum 44×44px (iOS) / 48×48dp (Android)
- **Ordre tab** : logique (haut → bas, gauche → droite)
- **Couleur** : jamais le seul indicateur d'état (toujours + icône ou texte)

---

## 7. Catalogue

### Catégories (16)
Tables, Fauteuils, Canapés, Lits, Rangements, Luminaires, Miroirs, Tapis, Textiles, Vases, Poterie, Sculptures, Tableaux, Cadres, Objets d'art, Déco

### Règles catalogue
- **Zéro vaisselle/ménager** — uniquement déco d'espace
- **Vases** = décoratifs pour fleurs, grands formats (pas de tasses/assiettes)
- **Artisans** = profils réels (pas fictifs), ajoutés via Supabase Table Editor
- **Monnaie** = FCFA (format `fr-FR`, ex: "145 000 FCFA")
- **Paiement** = FedaPay (MTN MoMo + Moov Money)

---

## 8. Référence visuelle

Le prototype HTML sur https://dedco-app.vercel.app/app-simulator.html est la **source de vérité visuelle**. Chaque écran de l'app native doit matcher pixel-perfect avec son équivalent HTML.

Pour comparer : ouvrir le prototype sur mobile (Chrome DevTools mode téléphone) et l'app native côte à côte.
