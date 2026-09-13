// Helpers communs aux tests d'intégration (Deno test runner).
// Ciblent par défaut l'instance Supabase LOCALE (`supabase start`) — ne
// jamais pointer LOCAL_* vers un projet de production.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

// Aucune valeur par défaut pour les clés : elles sont générées par la CLI à
// `supabase start` et changent d'une machine à l'autre. Récupère les
// tiennes avec `supabase status` (voir supabase/tests/README.md) et
// exporte-les avant de lancer les tests — ne jamais pointer ces variables
// vers un projet de production.
function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(
      `Variable d'env "${name}" manquante. Lance \`supabase status\` et exporte les clés ` +
        `(voir supabase/tests/README.md) avant de lancer les tests.`,
    );
  }
  return value;
}

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
export const SUPABASE_ANON_KEY = requiredEnv("SUPABASE_ANON_KEY");
export const SUPABASE_SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
export const FUNCTIONS_URL = Deno.env.get("FUNCTIONS_URL") ?? "http://127.0.0.1:54321/functions/v1";

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

let userCounter = 0;

/** Crée un utilisateur de test confirmé et retourne un client signé en son nom + son id. */
export async function createTestUser(
  role: "client" | "artisan" | "designer" | "admin" = "client",
): Promise<{ id: string; email: string; client: SupabaseClient }> {
  userCounter += 1;
  const email = `test-${role}-${Date.now()}-${userCounter}@dedco.test`;
  const password = "TestPassword123!";
  const admin = adminClient();

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !created.user) {
    throw new Error(`createTestUser(${role}) failed: ${error?.message}`);
  }

  if (role !== "client") {
    await admin.from("profiles").update({ role }).eq("id", created.user.id);
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) throw new Error(`signIn(${email}) failed: ${signInErr.message}`);

  return { id: created.user.id, email, client };
}

export async function deleteTestUser(id: string): Promise<void> {
  await adminClient().auth.admin.deleteUser(id).catch(() => {});
}

/** Crée une catégorie + un artisan + un produit de test, retourne leurs ids. */
export async function seedTestProduct(
  opts: { stock?: number; price?: number; artisanProfileId?: string | null } = {},
): Promise<{ categoryId: number; artisanId: string; productId: string }> {
  const admin = adminClient();
  const suffix = crypto.randomUUID().slice(0, 8);

  const { data: category } = await admin
    .from("categories")
    .select("id")
    .limit(1)
    .single();
  if (!category) throw new Error("Aucune catégorie trouvée — la migration initiale a-t-elle bien tourné ?");

  const { data: artisan, error: artisanErr } = await admin
    .from("artisans")
    .insert({
      profile_id: opts.artisanProfileId ?? null,
      name: `Artisan Test ${suffix}`,
      slug: `artisan-test-${suffix}`,
    })
    .select()
    .single();
  if (artisanErr) throw new Error(`seedTestProduct artisan: ${artisanErr.message}`);

  const { data: product, error: productErr } = await admin
    .from("products")
    .insert({
      artisan_id: artisan.id,
      category_id: category.id,
      name: `Produit Test ${suffix}`,
      slug: `produit-test-${suffix}`,
      price: opts.price ?? 10_000,
      stock: opts.stock ?? 5,
      is_active: true,
    })
    .select()
    .single();
  if (productErr) throw new Error(`seedTestProduct product: ${productErr.message}`);

  return { categoryId: category.id, artisanId: artisan.id, productId: product.id };
}

export async function cleanupProduct(productId: string, artisanId: string): Promise<void> {
  const admin = adminClient();
  await admin.from("products").delete().eq("id", productId);
  await admin.from("artisans").delete().eq("id", artisanId);
}

export async function callFunction(
  name: string,
  body: unknown,
  token?: string,
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}
