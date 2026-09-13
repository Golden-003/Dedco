// POST /submit-brief-artisan
// DRAFT → SUBMITTED → PUBLISHED. Notifie les artisans dont la spécialité
// correspond à la catégorie du brief, dans la même ville/zone si connue.
//
// Body: { briefId: string }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Body {
  briefId: string;
}

const BRIEF_EXPIRY_DAYS = 7;

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const { briefId } = await parseJson<Body>(req);
    if (!briefId) throw new HttpError(400, "briefId requis");

    const admin = adminClient();
    const { data: brief, error } = await admin
      .from("briefs_artisan")
      .select("*")
      .eq("id", briefId)
      .single();
    if (error || !brief) throw new HttpError(404, "Brief introuvable");
    if (brief.client_id !== user.id) throw new HttpError(403, "Ce brief ne vous appartient pas");
    if (!["DRAFT", "NEEDS_INFO"].includes(brief.status)) {
      throw new HttpError(409, `Impossible de soumettre un brief au statut "${brief.status}"`);
    }
    for (const field of ["title", "category", "budget_min", "budget_max"] as const) {
      if (!brief[field]) throw new HttpError(400, `Champ manquant : ${field}`);
    }

    const expiresAt = new Date(Date.now() + BRIEF_EXPIRY_DAYS * 86_400_000).toISOString();

    await admin
      .from("briefs_artisan")
      .update({ status: "PUBLISHED", expires_at: expiresAt })
      .eq("id", briefId);

    await admin.from("brief_artisan_history").insert([
      { brief_id: briefId, action: "submit", from_status: "DRAFT", to_status: "SUBMITTED", actor_id: user.id, actor_role: "client" },
      { brief_id: briefId, action: "publish", from_status: "SUBMITTED", to_status: "PUBLISHED", actor_id: user.id, actor_role: "client" },
    ]);

    // Artisans éligibles : même catégorie (specialty ilike), et même ville si renseignée.
    let query = admin
      .from("artisans")
      .select("id, profile_id")
      .ilike("specialty", `%${brief.category}%`);
    if (brief.zone) query = query.ilike("city", `%${brief.zone}%`);
    const { data: matchingArtisans } = await query.limit(50);

    for (const artisan of matchingArtisans ?? []) {
      if (!artisan.profile_id) continue;
      await notify(admin, {
        userId: artisan.profile_id,
        type: "brief_artisan",
        title: `Nouveau brief — ${brief.title}`,
        description: `Un client recherche un artisan en ${brief.category}. Budget : ${brief.budget_min}–${brief.budget_max} FCFA.`,
        route: { page: "artisan-brief-recu", briefId: brief.display_id },
        linkedId: brief.id,
      });
    }

    return json({ success: true, status: "PUBLISHED", notifiedArtisans: matchingArtisans?.length ?? 0 });
  }),
);
