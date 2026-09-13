// POST /complete-onboarding
// Appelée une fois, juste après l'inscription, quand l'utilisateur choisit
// son rôle (client / artisan / designer / maison). Crée les lignes
// professionnelles correspondantes — le wallet est auto-créé par un trigger
// SQL (`trg_artisans_create_wallet` / `trg_designers_create_wallet`).
//
// Body:
// {
//   role: "client" | "artisan" | "designer" | "maison",
//   name: string,
//   specialty?: string, city?: string, bio?: string, hourlyRate?: number
// }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { uniqueSlug } from "../_shared/slug.ts";

interface Body {
  role: "client" | "artisan" | "designer" | "maison";
  name: string;
  specialty?: string;
  city?: string;
  bio?: string;
  hourlyRate?: number;
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const body = await parseJson<Body>(req);

    if (!body.role || !body.name) {
      throw new HttpError(400, "role et name sont requis");
    }

    const admin = adminClient();
    const result: Record<string, unknown> = {};

    const { error: profileErr } = await admin
      .from("profiles")
      .update({ role: body.role })
      .eq("id", user.id);
    if (profileErr) throw new HttpError(500, profileErr.message);

    if (body.role === "artisan" || body.role === "maison") {
      const { data, error } = await admin
        .from("artisans")
        .insert({
          profile_id: user.id,
          name: body.name,
          slug: uniqueSlug(body.name),
          specialty: body.specialty ?? null,
          city: body.city ?? null,
          bio: body.bio ?? null,
        })
        .select()
        .single();
      if (error) throw new HttpError(500, error.message);
      result.artisan = data;
    }

    if (body.role === "designer" || body.role === "maison") {
      const { data, error } = await admin
        .from("designers")
        .insert({
          profile_id: user.id,
          name: body.name,
          slug: uniqueSlug(body.name),
          specialty: body.specialty ?? null,
          city: body.city ?? null,
          bio: body.bio ?? null,
          hourly_rate: body.hourlyRate ?? null,
        })
        .select()
        .single();
      if (error) throw new HttpError(500, error.message);
      result.designer = data;
    }

    return json({ success: true, ...result });
  }),
);