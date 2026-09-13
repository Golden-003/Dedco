// Simule un callback FedaPay signé, SANS toucher à la vraie API FedaPay :
// on recalcule la signature HMAC nous-mêmes avec FEDAPAY_WEBHOOK_SECRET
// (doit être défini côté fonction ET dans l'env du test avec la même
// valeur — voir supabase/tests/README.md). C'est le test le plus important
// du lot : ce endpoint est public et déclenche des écritures financières.
//
// Pré-requis : `supabase functions serve` + FEDAPAY_WEBHOOK_SECRET défini
// (`supabase secrets set` en local via `.env` chargé par `functions serve`).
// Lancer : deno test --allow-net --allow-env supabase/tests/functions.fedapay-webhook.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { adminClient, createTestUser, deleteTestUser, FUNCTIONS_URL } from "./_helpers.ts";

const WEBHOOK_SECRET = Deno.env.get("FEDAPAY_WEBHOOK_SECRET");

async function signPayload(rawBody: string, secret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},s=${hex}`;
}

Deno.test({
  name: "fedapay-webhook refuse une signature invalide",
  ignore: !WEBHOOK_SECRET,
  fn: async () => {
    const res = await fetch(`${FUNCTIONS_URL}/fedapay-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-FEDAPAY-SIGNATURE": "t=1,s=deadbeef" },
      body: JSON.stringify({ name: "transaction.approved", entity: { id: 1, status: "approved", amount: 1000 } }),
    });
    assertEquals(res.status, 401);
  },
});

Deno.test({
  name: "fedapay-webhook confirme une commande sur transaction.approved",
  ignore: !WEBHOOK_SECRET,
  fn: async () => {
    const admin = adminClient();
    const user = await createTestUser("client");
    try {
      const { data: order } = await admin
        .from("orders")
        .insert({
          user_id: user.id,
          type: "marketplace",
          status: "pending",
          subtotal: 10_000,
          shipping: 5_000,
          garantie: 150,
          total: 15_150,
          payment_ref: "999999",
        })
        .select()
        .single();

      const payload = JSON.stringify({
        name: "transaction.approved",
        entity: {
          id: 999999,
          status: "approved",
          amount: 15_150,
          custom_metadata: { kind: "order", orderId: order!.id, userId: user.id },
        },
      });
      const signature = await signPayload(payload, WEBHOOK_SECRET!);

      const res = await fetch(`${FUNCTIONS_URL}/fedapay-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-FEDAPAY-SIGNATURE": signature },
        body: payload,
      });
      assertEquals(res.status, 200);

      const { data: refreshed } = await admin.from("orders").select("status").eq("id", order!.id).single();
      assertEquals(refreshed?.status, "payé");
    } finally {
      await deleteTestUser(user.id);
    }
  },
});
