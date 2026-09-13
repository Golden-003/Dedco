# Tester le backend Dedco

Trois couches, du plus rapide au plus complet. Tout tourne en local — ne
jamais pointer ces tests vers le projet Supabase de production.

## 0. Installer la CLI et démarrer le stack local

```bash
brew install supabase/tap/supabase   # ou npm i -g supabase
cd Dedco
supabase init          # si pas déjà fait — ne touche ni migrations/ ni functions/
supabase start         # Postgres + Auth + Storage + Realtime en local (Docker)
```

`supabase start` applique automatiquement toutes les migrations dans
`supabase/migrations/` (dont `20260907120000_initial_schema.sql`) sur une
base fraîche. Récupère les clés générées pour CE lancement :

```bash
supabase status
```

Exporte-les (elles changent potentiellement d'une machine/version à l'autre —
ne jamais coder ces valeurs en dur) :

```bash
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_ANON_KEY="<anon key affichée par `supabase status`>"
export SUPABASE_SERVICE_ROLE_KEY="<service_role key affichée par `supabase status`>"
```

## 1. Vérifier le schéma lui-même

```bash
supabase db lint         # erreurs/avertissements sur les migrations
```

Pour rejouer les migrations depuis zéro (utile après avoir édité une
migration pendant le dev) :

```bash
supabase db reset
```

## 2. Tests d'intégration (schéma + RLS + Edge Functions)

Nécessite Deno (`brew install deno`).

```bash
# Terminal A — sert les Edge Functions localement
supabase functions serve --no-verify-jwt --env-file supabase/functions/.env.local

# Terminal B — lance les tests
deno test --config supabase/tests/deno.json --allow-net --allow-env supabase/tests/
```

`supabase/functions/.env.local` (non commité — à créer toi-même) doit
contenir au minimum, pour les tests qui en dépendent :

```
FEDAPAY_WEBHOOK_SECRET=un-secret-de-test-quelconque
DB_WEBHOOK_SECRET=un-autre-secret-de-test
```

Les tests qui ont besoin de `FEDAPAY_WEBHOOK_SECRET` s'auto-désactivent
(`ignore`) si la variable n'est pas exportée dans le terminal qui lance
`deno test` — pense à l'exporter aussi côté test, avec la MÊME valeur que
côté fonction.

**Deux pièges rencontrés en le faisant tourner pour de vrai, déjà réglés
dans les commandes ci-dessus — à garder si tu relances autrement :**

- **`--no-verify-jwt` sur `functions serve`.** Sans ce flag, la passerelle
  locale rejette avec un 401 toute requête sans JWT Supabase valide *avant
  même d'exécuter le code de la fonction* — ce qui casse `fedapay-webhook`
  et `send-push`, qui n'en envoient jamais (signature/secret partagé à la
  place). `supabase functions serve` n'a pas d'option par-fonction : c'est
  tout ou rien pour la session de dev locale. Comme chaque fonction fait
  déjà sa propre vérification (`requireUser`/`requireAdmin`), désactiver la
  vérification de la passerelle ne retire aucune protection réelle. (En
  déploiement individuel sur le vrai projet, `--no-verify-jwt` se pose bien
  par fonction — voir `supabase/functions/README.md`.)
- **`--config supabase/tests/deno.json`.** Le dossier de tests vit sous la
  racine du repo Next.js, qui a son propre `package.json`. Sans ce flag,
  Deno remonte jusqu'à ce `package.json`, bascule en résolution
  "node_modules" pour les imports `npm:`, et échoue à trouver
  `@supabase/supabase-js` (qui n'a jamais été installé côté npm — il n'a
  besoin de l'être nulle part, Deno le télécharge lui-même). Le fichier
  `supabase/tests/deno.json` (`{"nodeModulesDir": "none"}`) force la bonne
  résolution, mais seulement si on le pointe explicitement avec `--config`.

### Ce que couvre chaque fichier

| Fichier | Couvre |
|---|---|
| `schema.stock.test.ts` | `reserve_stock`/`release_stock` — atomicité, concurrence, panier multi-articles |
| `schema.wallet.test.ts` | `adjust_wallet_balance`/`release_wallet_transaction` — garde-fou plancher, idempotence |
| `rls.catalog.test.ts` | Lecture publique restreinte, écriture réservée au propriétaire |
| `functions.auth-guard.test.ts` | Chaque fonction protégée rejette bien les appels sans JWT / non-admin |
| `functions.fedapay-webhook.test.ts` | Signature invalide rejetée, signature valide confirme la commande |

Ce sont les tests les plus critiques (concurrence financière, sécurité des
endpoints), pas une couverture exhaustive des 22 fonctions. Le pattern dans
`_helpers.ts` (`createTestUser`, `seedTestProduct`, `callFunction`) est fait
pour être réutilisé — copie un fichier existant pour couvrir une nouvelle
fonction au fur et à mesure que tu la modifies.

## 3. Test manuel bout-en-bout (Supabase Studio + curl)

Une fois `supabase start` lancé, Studio est sur `http://127.0.0.1:54323` —
pratique pour inspecter les tables après un test, ou insérer des données à
la main.

Exemple d'appel direct à une fonction avec un vrai JWT (récupéré via
Studio → Authentication → un utilisateur → "Copy JWT", ou via
`supabase.auth.signInWithPassword` depuis la console navigateur de l'app) :

```bash
curl -i --location --request POST "http://127.0.0.1:54321/functions/v1/create-order" \
  --header "Authorization: Bearer <jwt>" \
  --header "Content-Type: application/json" \
  --data '{"items":[{"productId":"...","qty":1}],"addressId":"...","callbackUrl":"dedco://x"}'
```

## 4. Avant de déployer en vrai (staging/prod)

```bash
supabase link --project-ref <ref>
supabase db push          # applique les migrations manquantes sur le projet distant
supabase functions deploy <nom>
```

`supabase db push` compare les migrations locales à l'historique déjà
appliqué sur le projet distant et ne rejoue que ce qui manque — toujours
tester en local (étapes 1-2) avant.
