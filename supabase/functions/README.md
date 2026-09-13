# Edge Functions Dedco

22 fonctions Deno couvrant toute la logique métier qui ne peut pas passer par
un simple appel PostgREST + RLS (paiement, machine d'états, wallet, push).
Le catalogue complet des accès API (PostgREST vs Edge Function vs Realtime)
est documenté dans le plan d'architecture backend.

## Sommaire des fonctions

| Fonction | Déclenchée par | Auth |
|---|---|---|
| `complete-onboarding` | App, juste après inscription | JWT utilisateur |
| `create-order` | App, validation panier | JWT utilisateur |
| `fedapay-webhook` | FedaPay (callback paiement) | Signature FedaPay — `--no-verify-jwt` |
| `confirm-delivery` | App, client confirme réception (marketplace) | JWT utilisateur |
| `submit-review` | App, formulaire avis | JWT utilisateur |
| `submit-brief-artisan` | App, bouton "Envoyer le brief" | JWT utilisateur |
| `select-proposal` | App, client choisit un devis | JWT utilisateur |
| `pay-deposit-artisan` | App, bouton "Payer l'acompte" | JWT utilisateur |
| `update-milestone` | App artisan, jalon de fabrication | JWT utilisateur |
| `request-project-change` | App, demande de modification | JWT utilisateur |
| `respond-project-change` | App, réponse à une modification | JWT utilisateur |
| `confirm-delivery-artisan` | App, client confirme réception (sur-mesure) | JWT utilisateur |
| `open-complaint` | App, ouverture de litige | JWT utilisateur |
| `respond-brief-designer` | App designer, réponse à une demande | JWT utilisateur |
| `pay-deposit-designer` | App, paiement acompte designer | JWT utilisateur |
| `confirm-design-delivery` | App, validation livrables designer | JWT utilisateur |
| `request-withdrawal` | App artisan/designer, demande de retrait | JWT utilisateur |
| `review-kyc` | App admin | JWT + rôle admin |
| `resolve-dispute` | App admin | JWT + rôle admin |
| `start-conversation` | App, ouverture d'un fil de messagerie | JWT utilisateur |
| `send-push` | Database Webhook Supabase (table `notifications`) | Secret partagé — `--no-verify-jwt` |
| `admin-stats` | App admin, dashboard | JWT + rôle admin |

`_shared/` contient les helpers communs (client Supabase, FedaPay, push Expo,
notifications, CORS) — jamais déployé comme fonction, ignoré par la CLI.

## 1. Pré-requis

```bash
brew install supabase/tap/supabase   # ou npm i -g supabase
supabase login
supabase link --project-ref <PROJECT_REF>
```

## 2. Secrets à configurer

`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont
injectées automatiquement par le runtime — ne pas les redéfinir. À définir
manuellement :

```bash
supabase secrets set \
  FEDAPAY_SECRET_KEY=sk_sandbox_xxx \
  FEDAPAY_BASE_URL=https://sandbox-api.fedapay.com/v1 \
  FEDAPAY_WEBHOOK_SECRET=whsec_xxx \
  EXPO_ACCESS_TOKEN=xxx \
  DB_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

## 3. Développement local

```bash
supabase start                                    # lance Postgres + Auth + Storage en local
supabase functions serve --no-verify-jwt          # sert toutes les fonctions sur http://localhost:54321/functions/v1/<nom>
```

`--no-verify-jwt` est nécessaire ici : `functions serve` sert TOUTES les
fonctions avec un seul réglage de vérification JWT (pas de flag par
fonction comme au déploiement). Sans lui, la passerelle locale rejette en
401 les appels à `fedapay-webhook`/`send-push` avant même d'exécuter leur
code, puisqu'ils n'envoient jamais de JWT Supabase. Chaque fonction fait de
toute façon sa propre vérification (`requireUser`/`requireAdmin`), donc
aucune protection réelle n'est perdue en local.

Tester une fonction protégée par JWT :

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-order' \
  --header "Authorization: Bearer <jwt_utilisateur>" \
  --header "Content-Type: application/json" \
  --data '{"items":[{"productId":"...", "qty":1}], "addressId":"...", "callbackUrl":"dedco://order-confirmation"}'
```

## 4. Déploiement

La majorité des fonctions vérifient le JWT automatiquement (comportement par
défaut) :

```bash
supabase functions deploy complete-onboarding
supabase functions deploy create-order
supabase functions deploy confirm-delivery
supabase functions deploy submit-review
supabase functions deploy submit-brief-artisan
supabase functions deploy select-proposal
supabase functions deploy pay-deposit-artisan
supabase functions deploy update-milestone
supabase functions deploy request-project-change
supabase functions deploy respond-project-change
supabase functions deploy confirm-delivery-artisan
supabase functions deploy open-complaint
supabase functions deploy respond-brief-designer
supabase functions deploy pay-deposit-designer
supabase functions deploy confirm-design-delivery
supabase functions deploy request-withdrawal
supabase functions deploy review-kyc
supabase functions deploy resolve-dispute
supabase functions deploy start-conversation
supabase functions deploy admin-stats
```

Ces deux-là sont appelées par des services externes (FedaPay, Postgres) qui
n'envoient pas de JWT Supabase — elles doivent être déployées **sans**
vérification JWT, et se protègent elles-mêmes (signature / secret partagé) :

```bash
supabase functions deploy fedapay-webhook --no-verify-jwt
supabase functions deploy send-push --no-verify-jwt
```

## 5. Appeler une fonction depuis l'app (React Native / supabase-js)

```ts
const { data, error } = await supabase.functions.invoke("create-order", {
  body: { items: cart, addressId, callbackUrl: "dedco://order-confirmation" },
});
// supabase-js attache automatiquement le JWT de la session courante.
if (error) throw error;
const { order, checkoutUrl } = data;
await WebBrowser.openBrowserAsync(checkoutUrl); // FedaPay
```

Depuis le site web (Next.js), même appel via le client `supabase-js` navigateur.

## 6. Brancher le webhook FedaPay

Dans le dashboard FedaPay → Webhooks, configurer l'URL :

```
https://<project-ref>.functions.supabase.co/fedapay-webhook
```

et copier le secret de signature généré dans `FEDAPAY_WEBHOOK_SECRET` (étape 2).

## 7. Brancher les push notifications (Database Webhook)

Dashboard Supabase → **Database → Webhooks → Create a new hook** :

- Table : `notifications`
- Events : `INSERT`
- Type : `HTTP Request` → `POST`
- URL : `https://<project-ref>.functions.supabase.co/send-push`
- Headers : `X-Webhook-Secret: <valeur de DB_WEBHOOK_SECRET>`

Chaque notification insérée (par une Edge Function ou un trigger) déclenche
alors automatiquement une push Expo vers les `device_tokens` de l'utilisateur.

## 8. Logs & debug

```bash
supabase functions logs create-order --tail
```
