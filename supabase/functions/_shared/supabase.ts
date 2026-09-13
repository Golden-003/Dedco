// Clients Supabase pour les Edge Functions.
//
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont injectées
// automatiquement par le runtime Supabase — pas besoin de les définir via
// `supabase secrets set`.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

/** Client "service role" — bypasse RLS. À utiliser uniquement après avoir
 * vérifié soi-même les droits de l'appelant dans le code de la fonction. */
export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/** Client qui rejoue le JWT de l'appelant — les requêtes respectent RLS. */
export function userClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    },
  );
}

/** Résout l'utilisateur authentifié à partir du header Authorization.
 * Lève une HttpError 401 si absent/invalide. */
export async function requireUser(req: Request) {
  const supabase = userClient(req);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new HttpError(401, "Authentification requise");
  }
  return { user: data.user, supabase };
}

/** Vérifie que l'appelant a le rôle admin (lu via le client admin, la table
 * `profiles` n'étant pas publique). Lève une HttpError 403 sinon. */
export async function requireAdmin(req: Request) {
  const { user } = await requireUser(req);
  const admin = adminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    throw new HttpError(403, "Réservé aux administrateurs");
  }
  return { user, admin };
}

export async function parseJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Corps de requête JSON invalide");
  }
}