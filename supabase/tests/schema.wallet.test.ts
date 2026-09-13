// Teste adjust_wallet_balance et release_wallet_transaction directement en
// base. wallets.owner_id n'a pas de contrainte FK (design polymorphe
// artisan/designer) : on peut créer un wallet de test avec un owner_id
// factice, sans dépendre d'un artisan/profil réel.
//
// Lancer : deno test --allow-net --allow-env supabase/tests/schema.wallet.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { adminClient } from "./_helpers.ts";

async function createTestWallet(balance: number) {
  const admin = adminClient();
  const { data, error } = await admin
    .from("wallets")
    .insert({ owner_type: "artisan", owner_id: crypto.randomUUID(), balance })
    .select()
    .single();
  if (error) throw new Error(`createTestWallet: ${error.message}`);
  return data;
}

async function deleteTestWallet(id: string) {
  await adminClient().from("wallets").delete().eq("id", id);
}

Deno.test("adjust_wallet_balance crédite correctement", async () => {
  const admin = adminClient();
  const wallet = await createTestWallet(1000);
  try {
    const { data: ok } = await admin.rpc("adjust_wallet_balance", { p_wallet_id: wallet.id, p_delta: 500 });
    assertEquals(ok, true);
    const { data: refreshed } = await admin.from("wallets").select("balance").eq("id", wallet.id).single();
    assertEquals(refreshed?.balance, 1500);
  } finally {
    await deleteTestWallet(wallet.id);
  }
});

Deno.test("adjust_wallet_balance refuse un débit qui passerait le solde sous zéro", async () => {
  const admin = adminClient();
  const wallet = await createTestWallet(1000);
  try {
    const { data: ok } = await admin.rpc("adjust_wallet_balance", { p_wallet_id: wallet.id, p_delta: -2000 });
    assertEquals(ok, false, "le débit doit être refusé");
    const { data: refreshed } = await admin.from("wallets").select("balance").eq("id", wallet.id).single();
    assertEquals(refreshed?.balance, 1000, "le solde ne doit pas bouger en cas de refus");
  } finally {
    await deleteTestWallet(wallet.id);
  }
});

Deno.test("deux débits concurrents ne peuvent jamais rendre le solde négatif", async () => {
  const admin = adminClient();
  const wallet = await createTestWallet(1000);
  try {
    const [r1, r2] = await Promise.all([
      admin.rpc("adjust_wallet_balance", { p_wallet_id: wallet.id, p_delta: -1000 }),
      admin.rpc("adjust_wallet_balance", { p_wallet_id: wallet.id, p_delta: -1000 }),
    ]);
    const successes = [r1, r2].filter((r) => r.data === true).length;
    assertEquals(successes, 1, "un seul des deux débits concurrents doit réussir");

    const { data: refreshed } = await admin.from("wallets").select("balance").eq("id", wallet.id).single();
    assertEquals(refreshed?.balance, 0);
  } finally {
    await deleteTestWallet(wallet.id);
  }
});

Deno.test("release_wallet_transaction bascule le statut ET crédite le solde", async () => {
  const admin = adminClient();
  const wallet = await createTestWallet(0);
  try {
    const { data: txn } = await admin
      .from("wallet_transactions")
      .insert({ wallet_id: wallet.id, type: "credit", label: "Test", amount: 750, status: "pending" })
      .select()
      .single();

    const { data: released } = await admin.rpc("release_wallet_transaction", { p_txn_id: txn!.id });
    assertEquals(released, true);

    const { data: refreshedWallet } = await admin.from("wallets").select("balance").eq("id", wallet.id).single();
    assertEquals(refreshedWallet?.balance, 750);

    const { data: refreshedTxn } = await admin
      .from("wallet_transactions")
      .select("status")
      .eq("id", txn!.id)
      .single();
    assertEquals(refreshedTxn?.status, "completed");
  } finally {
    await deleteTestWallet(wallet.id);
  }
});

Deno.test("release_wallet_transaction est idempotent — pas de double crédit", async () => {
  const admin = adminClient();
  const wallet = await createTestWallet(0);
  try {
    const { data: txn } = await admin
      .from("wallet_transactions")
      .insert({ wallet_id: wallet.id, type: "credit", label: "Test", amount: 300, status: "pending" })
      .select()
      .single();

    const first = await admin.rpc("release_wallet_transaction", { p_txn_id: txn!.id });
    const second = await admin.rpc("release_wallet_transaction", { p_txn_id: txn!.id });
    assertEquals(first.data, true);
    assertEquals(second.data, false, "un 2e appel sur une transaction déjà 'completed' doit être un no-op");

    const { data: refreshedWallet } = await admin.from("wallets").select("balance").eq("id", wallet.id).single();
    assertEquals(refreshedWallet?.balance, 300, "le solde ne doit être crédité qu'une seule fois");
  } finally {
    await deleteTestWallet(wallet.id);
  }
});
