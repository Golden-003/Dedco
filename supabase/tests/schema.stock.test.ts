// Teste reserve_stock / release_stock directement en base (via le client
// service role, comme le font les Edge Functions). Couvre exactement le bug
// trouvé en revue de code : la survente en cas de concurrence.
//
// Lancer : deno test --allow-net --allow-env supabase/tests/schema.stock.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { adminClient, cleanupProduct, seedTestProduct } from "./_helpers.ts";

Deno.test("reserve_stock décrémente le stock quand il est suffisant", async () => {
  const admin = adminClient();
  const { productId, artisanId } = await seedTestProduct({ stock: 5 });
  try {
    const { error } = await admin.rpc("reserve_stock", {
      items: [{ productId, qty: 2 }],
    });
    assertEquals(error, null);

    const { data: product } = await admin.from("products").select("stock").eq("id", productId).single();
    assertEquals(product?.stock, 3);
  } finally {
    await cleanupProduct(productId, artisanId);
  }
});

Deno.test("reserve_stock refuse et ne touche à rien si le stock est insuffisant", async () => {
  const admin = adminClient();
  const { productId, artisanId } = await seedTestProduct({ stock: 1 });
  try {
    const { error } = await admin.rpc("reserve_stock", {
      items: [{ productId, qty: 5 }],
    });
    if (!error) throw new Error("reserve_stock aurait dû échouer (stock insuffisant)");
    if (!error.message.includes("INSUFFICIENT_STOCK")) {
      throw new Error(`message d'erreur inattendu: ${error.message}`);
    }

    const { data: product } = await admin.from("products").select("stock").eq("id", productId).single();
    assertEquals(product?.stock, 1, "le stock ne doit pas bouger en cas d'échec");
  } finally {
    await cleanupProduct(productId, artisanId);
  }
});

Deno.test("reserve_stock est tout-ou-rien sur un panier multi-articles", async () => {
  const admin = adminClient();
  const a = await seedTestProduct({ stock: 5 });
  const b = await seedTestProduct({ stock: 1 });
  try {
    // Le 2e article demande plus que son stock → toute la réservation doit échouer,
    // y COMPRIS le décrément déjà fait sur le 1er article dans la même fonction SQL.
    const { error } = await admin.rpc("reserve_stock", {
      items: [
        { productId: a.productId, qty: 2 },
        { productId: b.productId, qty: 10 },
      ],
    });
    if (!error) throw new Error("reserve_stock aurait dû échouer");

    const { data: productA } = await admin.from("products").select("stock").eq("id", a.productId).single();
    assertEquals(productA?.stock, 5, "le 1er article ne doit pas rester décrémenté après l'échec du 2e");
  } finally {
    await cleanupProduct(a.productId, a.artisanId);
    await cleanupProduct(b.productId, b.artisanId);
  }
});

Deno.test("deux réservations concurrentes sur le dernier exemplaire : une seule réussit", async () => {
  const admin = adminClient();
  const { productId, artisanId } = await seedTestProduct({ stock: 1 });
  try {
    const [r1, r2] = await Promise.all([
      admin.rpc("reserve_stock", { items: [{ productId, qty: 1 }] }),
      admin.rpc("reserve_stock", { items: [{ productId, qty: 1 }] }),
    ]);
    const successes = [r1, r2].filter((r) => !r.error).length;
    assertEquals(successes, 1, "exactement une des deux réservations doit réussir");

    const { data: product } = await admin.from("products").select("stock").eq("id", productId).single();
    assertEquals(product?.stock, 0);
  } finally {
    await cleanupProduct(productId, artisanId);
  }
});

Deno.test("release_stock restitue le stock réservé", async () => {
  const admin = adminClient();
  const { productId, artisanId } = await seedTestProduct({ stock: 3 });
  try {
    await admin.rpc("reserve_stock", { items: [{ productId, qty: 3 }] });
    await admin.rpc("release_stock", { items: [{ productId, qty: 3 }] });

    const { data: product } = await admin.from("products").select("stock").eq("id", productId).single();
    assertEquals(product?.stock, 3);
  } finally {
    await cleanupProduct(productId, artisanId);
  }
});
