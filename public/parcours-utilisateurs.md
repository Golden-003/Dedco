# DEDCO — Parcours Utilisateurs par Rôle

> Document basé sur le code réel du prototype (v11). Chaque parcours,
> action et permission décrit ici existe dans le code.

---

## 1. VISITEUR (non connecté)

### Parcours principal

```
Accueil → Marketplace → Fiche produit → (Ajouter au panier → Checkout → Paiement)
                ↓
          Inspirations → Scène → "Ajouter les N produits au panier"
                ↓
          Artisans → Profil artisan → "Contacter l'artisan" → (redirige vers login)
                ↓
          Designers → Profil designer
                ↓
          Magazine → Article
```

### Actions possibles

| Action | Page | État |
|---|---|---|
| Naviguer la marketplace + filtres | `/marketplace` | ✅ Tri, prix, catégorie, artisan, favoris |
| Voir une fiche produit + galerie + avis | `product/[id]` | ✅ Flèches navigation, compteur photos |
| Voir une scène d'inspiration | `scene/[slug]` | ✅ Shop the look, ajouter au panier |
| Voir le profil d'un artisan | `artisan/[id]` | ✅ Portfolio, produits, avis |
| Voir le profil d'un designer | `designer/[id]` | ✅ Portfolio, tarifs |
| Lire un article magazine | `article/[id]` | ✅ Commentaires (publier = redirige login) |
| S'inscrire | `register` | ✅ Inscription client simple (1 étape) |
| Se connecter | `login` | ✅ Login classique + démo rôles |
| Devenir artisan | `become-artisan` | ✅ Formulaire de candidature + KYC |
| Voir les plans et tarifs | `plans-tarifs` | ✅ Artisan + Designer |

### Actions BLOQUÉES (nécessitent auth)

| Action | Redirection |
|---|---|
| Ajouter au panier | Le panier fonctionne mais checkout → besoin d'être connecté |
| Laisser un avis | `avis-livraison` → vérifie `currentUser` |
| Ouvrir un litige | `litige` → page AUTH_REQUIRED |
| Messagerie | `messages` → page AUTH_REQUIRED |
| Favoris / Moodboard | `favorites`, `moodboard` → page AUTH_REQUIRED |
| Profil / Paramètres | `profile`, `settings` → page AUTH_REQUIRED |

### Notifications
Aucune — le visiteur n'a pas de notifications.

### États UI

| État | Composant | Implémentation |
|---|---|---|
| Liste vide | Marketplace | "Aucun produit trouvé" + bouton réinitialiser |
| Recherche vide | Marketplace | Icône Search + message |
| Chargement | `hasHydrated` | Spinner plein écran (Zustand hydration) |
| Erreur produit | ProductPage | "Produit introuvable" + bouton Retour |

### Permissions (route guard)

```
isPublicPage = true pour : home, marketplace, product, scene, artisan,
               designer, inspirations, magazine, article, about,
               become-artisan, help-center, plans-tarifs, login, register
```

Le visiteur peut accéder à toutes les pages publiques. Les pages `AUTH_REQUIRED` redirigent vers `login`.

---

## 2. CLIENT (connecté, rôle = client)

### Parcours principal

```
Login → Accueil
  ├── Marketplace → Produit → Panier → Checkout → Paiement → Confirmation
  │         ↓                                                              ↓
  │     Favoris                                                    Suivi commande
  │                                                                    ↓
  │                                                            "Marquer comme livré"
  │                                                                    ↓
  │                                                            "Laisser un avis"
  │                                                                    ↓
  │                                                            Avis publié sur fiche produit
  │
  ├── Inspirations → Scène → Ajouter produits au panier
  │
  ├── Mes Projets (onglets)
  │     ├── En cours → Suivi projet artisan/designer
  │     ├── À choisir → Comparer propositions → Choisir → Payer acompte
  │     ├── Terminés → Voir détails
  │     └── Réclamations → Ouvrir un litige
  │
  ├── Brief artisan → Publier un brief → Recevoir propositions → Choisir → Payer
  │
  ├── Brief designer → Décrire le besoin → Designer répond → Proposition → Payer
  │
  ├── Profil → Modifier infos → Adresses → Déconnexion
  │
  ├── Messages → Conversations avec artisans/designers
  │
  └── Notifications → Livraison, messages, mises à jour projet
```

### Actions principales

| Action | Route | Détail |
|---|---|---|
| Passer une commande marketplace | `checkout → payment → order-confirmation` | Sauvegarde réelle dans `store.orders[]` via `placeOrder()` |
| Suivre une commande | `order-tracking` | Timeline + statut dynamique + bouton "Marquer comme livré" |
| Laisser un avis (marketplace) | `avis-livraison` (orderId) | Étoiles + sous-critères + commentaire → visible sur fiche produit |
| Laisser un avis (sur-mesure) | `avis-livraison` (projectId) | Visible sur profil artisan seulement |
| Laisser un avis (designer) | `avis-livraison` (projectId PD-XXX) | Visible sur profil designer |
| Confirmer réception projet artisan | `projet-artisan-detail` | Bouton "Confirmer" → notification + débloque avis |
| Valider livraison projet designer | `projet-livraison` | Bouton "Valider" → débloque avis |
| Créer un brief artisan | `brief` | Wizard 2 étapes → brief publié |
| Créer un brief designer | `brief-designer` | Wizard 2 étapes → envoyé au designer |
| Comparer propositions | `mes-projets` → onglet "À choisir" | Cartes artisans + bouton "Choisir" |
| Payer un acompte | `projet-paiement-artisan` / `projet-paiement` | Mobile Money (MTN/Moov) |
| Voir la facture | `invoice` | 3 types : marketplace, artisan, designer |
| Ouvrir un litige | `litige` | Formulaire : raison + description + photos |
| Envoyer un message | `messages` | Chat avec artisan/designer |
| Gérer ses favoris | `favorites` | Produits favoris |
| Gérer son profil | `profile` | Infos perso + adresses |
| Voir l'historique de commandes | `order-history` | Lit depuis `store.orders[]` |
| Se déconnecter | — | `logout()` → retour accueil visiteur |

### Permissions

| Peut accéder | Ne peut PAS accéder |
|---|---|
| Toutes les pages publiques | `artisan-dashboard` et toutes `ARTISAN_PAGES` |
| `profile`, `wallet`, `messages`, `notifications` | `designer-dashboard` et toutes `DESIGNER_PAGES` |
| `client-projets`, `order-history`, `favorites` | `admin-dashboard` et toutes `ADMIN_PAGES` |
| `brief`, `brief-list`, `brief-create` | `maison-dashboard` |
| `cart`, `checkout`, `payment`, `order-*` | Pages prestataires (brief-recu, devis-create, etc.) |
| `litige`, `moodboard`, `search`, `settings` | |
| `avis-livraison`, `projet-*-detail` | |

**Route guard** : `isPrestataireLocked = false` pour le client → il garde l'accès au site public.

### Notifications (5 types client)

| Type | Exemple |
|---|---|
| `delivery` | "Livraison en cours — Lampe Bogolan" |
| `delivery` | "Réception à confirmer — Lampe Bogolan" |
| `message` | "Message de Fatou Loko" |
| `project` | "Mise à jour projet — Table basse Wax" |
| `payment` | "Acompte payé — Table basse Wax" |

### États UI

| État | Page | Message |
|---|---|---|
| Panier vide | `cart` | "Votre panier est vide" + bouton marketplace |
| Aucune commande | `order-history` | "Aucune commande pour le moment" + bouton marketplace |
| Aucun avis sur produit | `product/[id]` | "Aucun avis pour le moment" |
| Aucun favori | `favorites` | État vide |
| Aucune notification | `notifications` | "Vous êtes à jour" / "Rien ici pour le moment" |
| Messagerie vide | `messages` | "Vos conversations" + message d'info |
| Aucun projet | `mes-projets` | État vide par onglet |

### Cas limites

| Cas | Comportement |
|---|---|
| Commander sans être connecté | Checkout fonctionne mais payment page vérifie l'auth |
| Laisser un avis sans commande livrée | Bouton "Laisser un avis" ne s'affiche que si `status === 'livré'` |
| Laisser un avis deux fois | `hasReviewed(orderId)` → badge "Avis déjà publié" |
| Ouvrir un litige sans commande | Formulaire s'affiche quand même (pas de guard sur commande) |
| Confirmer réception déjà confirmée | `deliveryConfirmed` state → bouton disparaît |

---

## 3. ARTISAN (connecté, rôle = artisan)

### Parcours principal

```
Login démo → Dashboard artisan
  ├── Tableau de bord (KPIs + commandes récentes + briefs reçus)
  │
  ├── Demandes (briefs reçus)
  │     ├── Voir le brief
  │     ├── Poser des questions
  │     ├── Envoyer un devis (proposition)
  │     └── Refuser le brief
  │
  ├── Projets (Kanban)
  │     ├── En attente → En fabrication → Prêt → En livraison → Livré
  │     ├── Détail projet (jalons + photos + messages)
  │     └── Marquer jalons comme faits
  │
  ├── Commandes
  │     ├── Liste des commandes marketplace
  │     └── Détail commande → Contacter le client
  │
  ├── Produits (CRUD)
  │     ├── Ajouter un produit
  │     ├── Modifier un produit
  │     └── Supprimer un produit
  │
  ├── Wallet
  │     ├── Solde disponible + en attente
  │     ├── Historique transactions
  │     └── Retrait Mobile Money
  │
  ├── Avis (reçus des clients)
  │     ├── Note globale + histogramme
  │     ├── Sous-critères (qualité, délais, communication)
  │     └── Répondre à un avis
  │
  ├── Certification N4
  │     ├── Soumettre dossier (photos atelier + description)
  │     └── Statut de la demande
  │
  ├── Abonnement (Gratuit / Pro / Boutique)
  │
  ├── Paramètres (profil, téléphone, notifications)
  │
  ├── Messages (avec clients)
  │
  └── Notifications
```

### Actions principales

| Action | Route | Détail |
|---|---|---|
| Voir son dashboard | `artisan-dashboard` | KPIs : commandes, revenus, note (depuis review-store), produits |
| Répondre à un brief | `artisan-brief-recu` | Voir brief → poser questions OU envoyer devis OU refuser |
| Envoyer un devis | `artisan-devis-create` | Prix + délai + matériaux + photos + conditions paiement |
| Suivre un projet | `projet-artisan-detail` | Jalons (préparation → fabrication → prêt → livraison) + photos |
| Marquer un jalon | `projet-artisan-detail` | Bouton "Marquer comme fait" + upload photo |
| Gérer son catalogue | `artisan-products` | Tableau produits + vue grille + CRUD |
| Voir son wallet | `artisan-wallet` | Solde + transactions + retrait |
| Retrait Mobile Money | `artisan-wallet` (modal) | Numéro + montant → "Demande envoyée" |
| Voir ses avis | `artisan-avis` | Note globale + histogramme + liste avis + répondre |
| Demander certification N4 | `artisan-certification` | Photos atelier + description processus + statut |
| Changer d'abonnement | `artisan-abonnement` | Gratuit / Pro / Boutique + comparatif |
| Contacter un client | `messages` | Chat avec le client |
| Voir la facture d'un projet | `invoice` (PA-XXX) | Facture projet sur-mesure dédiée |

### Permissions

| Peut accéder | Ne peut PAS accéder |
|---|---|
| `artisan-*` (toutes les pages artisan) | Site public (marketplace, product, etc.) |
| `messages`, `notifications`, `settings` | `designer-*`, `admin-*`, `maison-*` |
| `projet-artisan-detail` (partagé avec client) | `client-projets` (page client) |
| `invoice` (PA-XXX → facture artisan) | `brief-designer` (brief designer) |
| `profile` | `plans-tarifs` (page publique mais locked) |

**Route guard** : `isPrestataireLocked = true` → **enfermé dans le dashboard**. Aucun accès au site public. La navbar publique et le bottom-nav sont masqués.

### Notifications (5 types artisan)

| Type | Exemple |
|---|---|
| `brief_artisan` | "Nouveau brief reçu — Dressing sur mesure" |
| `order` | "Nouvelle commande — Fauteuil Sahel" |
| `payment` | "Paiement reçu — Table Iroko" |
| `message` | "Message client — Sophie K." |
| `system` | "Votre niveau a été mis à jour" |

### États UI

| État | Page | Message |
|---|---|---|
| Aucun brief reçu | `artisan-demandes` | État vide |
| Aucun projet en cours | `artisan-projets` | Kanban vide |
| Aucun produit | `artisan-products` | "Ajouter votre premier produit" |
| Aucun avis | `artisan-avis` | "Aucun avis pour le moment" |
| Wallet vide | `artisan-wallet` | Solde = 0 FCFA |
| Certification non demandée | `artisan-certification` | Bouton "Demander" |

### Cas limites

| Cas | Comportement |
|---|---|
| Artisan tente d'accéder au site public | `isLockedOut` → redirection `artisan-dashboard` |
| Artisan tente de voir les pages designer | `getRequiredRole` retourne 'designer' → redirection `artisan-dashboard` |
| Brief expiré | Statut `expired` (non implémenté dans le prototype) |
| Devis refusé par le client | Statut `rejected` sur la proposition |

---

## 4. DESIGNER (connecté, rôle = designer)

### Parcours principal

```
Login démo → Dashboard designer
  ├── Tableau de bord (KPIs + projets + briefs)
  │
  ├── Projets
  │     ├── Liste des missions
  │     ├── Détail projet (livrables + révisions + messages)
  │     └── Livrer (upload moodboard, plan, palette, sourcing)
  │
  ├── Briefs reçus
  │     ├── Voir le brief client
  │     ├── Envoyer une proposition de mission
  │     └── Refuser
  │
  ├── Profil (portfolio, style, tarifs)
  │
  ├── Wallet (gains designer, 0% commission)
  │
  ├── Portfolio (gérer ses réalisations)
  │
  ├── Abonnement (Essentiel / Pro / Signature)
  │
  ├── Paramètres
  │
  ├── Messages (avec clients)
  │
  └── Notifications
```

### Actions principales

| Action | Route | Détail |
|---|---|---|
| Voir son dashboard | `designer-dashboard` | KPIs + projets récents |
| Répondre à un brief | `designer-brief-recu` | Voir brief → envoyer proposition |
| Envoyer une proposition | `designer-proposition-mission` | Objectif + livrables + étapes + prix + inclusions/exclusions |
| Suivre un projet | `projet-designer-detail` | Livrables + révisions + calendrier + messages |
| Uploader un livrable | `projet-designer-detail` (onglet livrables) | Moodboard, plan 2D, palette, sourcing |
| Gérer les révisions | `projet-designer-detail` (onglet révisions) | Voir demande de révision + livrer correction |
| Gérer son portfolio | `designer-portfolio` | Ajouter/modifier/supprimer réalisations |
| Voir son wallet | `designer-wallet` | "Aucune commission Dedco" — 100% des gains |
| Changer d'abonnement | `designer-abonnement` | Essentiel / Pro / Signature |
| Contacter un client | `messages` | Chat avec le client |
| Voir la facture | `invoice` (PD-XXX) | Facture prestation designer dédiée |

### Permissions

| Peut accéder | Ne peut PAS accéder |
|---|---|
| `designer-*` (toutes les pages designer) | Site public (marketplace, product, etc.) |
| `messages`, `notifications`, `settings` | `artisan-*`, `admin-*`, `maison-*` |
| `projet-designer-detail` (partagé avec client) | `client-projets` |
| `invoice` (PD-XXX → facture designer) | `brief` (brief artisan) |
| `profile` | |

**Route guard** : `isPrestataireLocked = true` → enfermé dans le dashboard.

### Notifications (4 types designer)

| Type | Exemple |
|---|---|
| `brief_designer` | "Nouveau brief designer reçu" |
| `payment` | "Paiement reçu — Plan salon" |
| `message` | "Message client — Marc A." |
| `review` | "Avis 5 étoiles reçu" |

### États UI

| État | Page | Message |
|---|---|---|
| Aucun brief | `designer-briefs` | État vide |
| Aucun projet | `designer-projects` | État vide |
| Aucun livrable | `projet-designer-detail` | "Livrables à venir" |
| Portfolio vide | `designer-portfolio` | "Ajoutez vos premières réalisations" |
| Wallet vide | `designer-wallet` | Solde = 0 |

### Cas limites

| Cas | Comportement |
|---|---|
| Designer tente d'accéder au site public | Redirection `designer-dashboard` |
| Révisions épuisées | `revisionsIncluses` = 2 → "Révisions supplémentaires payantes" |
| Projet livré mais non validé | `DELIVERED_PENDING_VALIDATION` → attente client |
| Projet validé | `COMPLETED` → bouton "Laisser un avis" apparaît côté client |

---

## 5. ADMIN (connecté, rôle = admin)

### Parcours principal

```
Login démo → Dashboard admin
  ├── Vue d'ensemble (KPIs + activité + file de modération)
  │
  ├── Utilisateurs (liste, filtres, bannir)
  ├── Produits (modération, valider/supprimer)
  ├── Commandes (toutes les commandes)
  ├── Analytics (graphiques, tendances)
  ├── Contenu (scènes, collections, articles)
  ├── KYC (valider documents artisans)
  ├── Messages (modération, anti-contournement)
  ├── Litiges (arbitrage, résolution)
  ├── Certification N4 (examiner demandes)
  └── Paramètres (config plateforme, taux garantie)
```

### Actions principales

| Action | Route | Détail |
|---|---|---|
| Voir le dashboard | `admin-dashboard` | KPIs + activités (lien direct vers la bonne page) |
| Gérer les utilisateurs | `admin-users` | Liste + filtres par rôle + bloquer |
| Modérer les produits | `admin-products` | Valider / refuser / supprimer |
| Voir toutes les commandes | `admin-orders` | Toutes les commandes de la plateforme |
| Analytics | `admin-analytics` | Graphiques revenus, commandes, tendances |
| Valider les KYC | `admin-kyc` | Documents en attente → approuver / refuser |
| Modérer les messages | `admin-messages` | Messages flaggés (anti-contournement) |
| Arbitrer les litiges | `admin-litiges` | Détail litige → résolution (remboursement, etc.) |
| Valider certification N4 | `admin-certification` | Examiner demandes → approuver / refuser |
| Gérer le contenu | `admin-content` | Scènes, collections, articles magazine |
| Configurer la plateforme | `admin-parametres` | Taux garantie, commissions, etc. |

### Permissions

| Peut accéder | Ne peut PAS accéder |
|---|---|
| `admin-*` (toutes les pages admin) | `artisan-*`, `designer-*`, `maison-*` |
| **Site public** (marketplace, product, etc.) | (l'admin garde l'accès au site public) |
| `messages`, `notifications`, `settings` | |
| `invoice` (tous types) | |

**Route guard** : `isPrestataireLocked = false` pour l'admin → **garde l'accès au site public**. L'admin peut naviguer comme un client + accéder à son dashboard.

### Notifications (4 types admin)

| Type | Exemple |
|---|---|
| `system` | "3 KYC en attente de validation" |
| `litige` | "Nouveau litige ouvert — CMD-2026-4520" |
| `system` | "Pic de trafic détecté" |
| `system` | "4 messages flaggés par modération" |

### États UI

| État | Page | Message |
|---|---|---|
| Aucun utilisateur | `admin-users` | Tableau vide |
| Aucun KYC en attente | `admin-kyc` | "Tout est à jour" |
| Aucun litige | `admin-litiges` | "Aucun litige en cours" |
| Aucun produit à modérer | `admin-products` | "Aucun produit en attente" |

---

## 6. MAISON DE DÉCO (connecté, rôle = maison)

### Parcours principal

```
Login démo → Dashboard maison
  ├── Vue d'ensemble (KPIs + commandes récentes)
  ├── Commandes (historique)
  ├── Catalogue (moodboard)
  ├── Factures (wallet)
  ├── Messages
  ├── Notifications
  └── Paramètres
```

### Actions principales

| Action | Route | Détail |
|---|---|---|
| Voir le dashboard | `maison-dashboard` | KPIs + commandes récentes |
| Voir les commandes | `order-history` | Lit depuis `store.orders[]` |
| Voir le catalogue | `moodboard` | Inspirations + produits |
| Voir les factures | `wallet` | Transactions + retrait |
| Messages | `messages` | Chat avec artisans/designers |
| Notifications | `notifications` | Notifications maison |
| Paramètres | `settings` | Configuration compte |

### Permissions

| Peut accéder | Ne peut PAS accéder |
|---|---|
| `maison-dashboard` | Site public (locked) |
| `order-history`, `wallet`, `messages` | `artisan-*`, `designer-*`, `admin-*` |
| `moodboard`, `notifications`, `settings` | |

**Route guard** : `isPrestataireLocked = true` → enfermé dans le dashboard. Sidebar avec 7 liens accessibles (dashboard, commandes, catalogue, factures, messages, notifications, paramètres).

---

## 7. TABLEAU RÉCAPITULATIF

### Accès par rôle

| Zone | Visiteur | Client | Artisan | Designer | Admin | Maison |
|---|---|---|---|---|---|---|
| Site public (marketplace, etc.) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Inscription client | ✅ | — | — | — | — | — |
| Candidature prestataire | ✅ | ✅ | — | — | — | — |
| Dashboard dédié | — | — | ✅ | ✅ | ✅ | ✅ |
| Passer une commande | — | ✅ | ❌ | ❌ | ✅ | ❌ |
| Créer un brief | — | ✅ | ❌ | ❌ | ✅ | ❌ |
| Laisser un avis | — | ✅ | ❌ | ❌ | ✅ | ❌ |
| Messagerie | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Wallet | — | — | ✅ | ✅ | — | ✅ |
| Gestion produits | — | — | ✅ | — | ✅ (modération) | — |
| Gestion projets | — | ✅ (suivi) | ✅ (exécution) | ✅ (exécution) | ✅ (supervision) | — |
| KYC | — | — | ✅ (soumettre) | ✅ (soumettre) | ✅ (valider) | — |
| Litiges | — | ✅ (ouvrir) | ✅ (répondre) | ✅ (répondre) | ✅ (arbitrer) | — |

### Inscription

| Rôle | Comment | KYC | Validation |
|---|---|---|---|
| Client | `register` (formulaire simple) | ❌ Aucun | Email de confirmation |
| Artisan | `become-artisan` (candidature) | ✅ Obligatoire | Admin valide (48-72h) |
| Designer | `become-artisan` (candidature) | ✅ Obligatoire | Admin valide (48-72h) |
| Maison | `become-artisan` (candidature) | ✅ Obligatoire | Admin valide (48-72h) |
| Admin | Créé manuellement par Dedco | — | — |
