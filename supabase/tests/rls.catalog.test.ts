// Vérifie les policies RLS les plus fondamentales du catalogue : lecture
// publique restreinte aux produits actifs, écriture réservée au
// propriétaire.
//
// Lancer : deno test --allow-net --allow-env supabase/tests/rls.catalog.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { adminClient, anonClient, cleanupProduct, createTestUser, deleteTestUser, seedTestProduct } from "./_helpers.ts";

Deno.test("anon voit un produit actif", async () => {
  const { productId, artisanId } = await seedTestProduct({ stock: 1 });
  try {
    const { data, error } = await anonClient().from("products").select("id").eq("id", productId).maybeSingle();
    assertEquals(error, null);
    assertEquals(data?.id, productId);
  } finally {
    await cleanupProduct(productId, artisanId);
  }
});

Deno.test("anon ne voit PAS un produit désactivé", async () => {
  const { productId, artisanId } = await seedTestProduct({ stock: 1 });
  const admin = adminClient();
  await admin.from("products").update({ is_active: false }).eq("id", productId);
  try {
    const { data } = await anonClient().from("products").select("id").eq("id", productId).maybeSingle();
    assertEquals(data, null, "un produit inactif ne doit pas être lisible par anon");
  } finally {
    await cleanupProduct(productId, artisanId);
  }
});

Deno.test("anon ne peut pas insérer de produit", async () => {
  const { error } = await anonClient().from("products").insert({
    name: "Piratage",
    slug: `piratage-${crypto.randomUUID()}`,
    price: 1,
  });
  if (!error) throw new Error("anon n'aurait jamais dû pouvoir insérer un produit");
});

Deno.test("un artisan ne peut pas modifier le produit d'un autre artisan", async () => {
  const artisanA = await createTestUser("artisan");
  const artisanB = await createTestUser("artisan");
  const { productId, artisanId } = await seedTestProduct({ artisanProfileId: artisanA.id });
  try {
    // artisanB tente de modifier le produit d'artisanA
    const { data, error } = await artisanB.client
      .from("products")
      .update({ price: 1 })
      .eq("id", productId)
      .select();
    // RLS bloque silencieusement : pas d'erreur, mais 0 ligne affectée.
    assertEquals(error, null);
    assertEquals(data?.length ?? 0, 0, "la mise à jour ne doit toucher aucune ligne");

    const { data: unchanged } = await adminClient().from("products").select("price").eq("id", productId).single();
    if (unchanged?.price === 1) throw new Error("le prix a été modifié par un artisan non-propriétaire !");
  } finally {
    await cleanupProduct(productId, artisanId);
    await deleteTestUser(artisanA.id);
    await deleteTestUser(artisanB.id);
  }
});
