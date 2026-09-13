// Vérifie que chaque Edge Function protégée rejette bien les appels non
// authentifiés (401) et que les fonctions admin rejettent les non-admins
// (403). Ne teste PAS la logique métier — juste le garde-fou d'entrée,
// l'erreur la plus facile à oublier en copiant-collant un nouveau handler.
//
// Pré-requis : `supabase functions serve` doit tourner en parallèle.
// Lancer   : deno test --allow-net --allow-env supabase/tests/functions.auth-guard.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFunction, createTestUser, deleteTestUser } from "./_helpers.ts";

const USER_PROTECTED_FUNCTIONS = [
  "complete-onboarding",
  "create-order",
  "confirm-delivery",
  "submit-review",
  "submit-brief-artisan",
  "select-proposal",
  "pay-deposit-artisan",
  "update-milestone",
  "request-project-change",
  "respond-project-change",
  "confirm-delivery-artisan",
  "open-complaint",
  "respond-brief-designer",
  "pay-deposit-designer",
  "confirm-design-delivery",
  "request-withdrawal",
  "start-conversation",
];

const ADMIN_ONLY_FUNCTIONS = ["review-kyc", "resolve-dispute", "admin-stats"];

for (const fn of USER_PROTECTED_FUNCTIONS) {
  Deno.test(`${fn} refuse un appel sans JWT (401)`, async () => {
    const { status } = await callFunction(fn, {});
    assertEquals(status, 401, `${fn} devrait renvoyer 401 sans Authorization header`);
  });
}

for (const fn of ADMIN_ONLY_FUNCTIONS) {
  Deno.test(`${fn} refuse un appel sans JWT (401)`, async () => {
    const { status } = await callFunction(fn, {});
    assertEquals(status, 401);
  });

  Deno.test(`${fn} refuse un utilisateur non-admin (403)`, async () => {
    const client = await createTestUser("client");
    try {
      const { data: session } = await client.client.auth.getSession();
      const token = session.session?.access_token;
      const { status } = await callFunction(fn, {}, token);
      assertEquals(status, 403, `${fn} devrait renvoyer 403 pour un client non-admin`);
    } finally {
      await deleteTestUser(client.id);
    }
  });
}
