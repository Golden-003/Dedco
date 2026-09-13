// POST /respond-project-change
// L'autre partie accepte ou refuse une demande de modification. Si acceptée,
// applique l'impact prix et, quand le champ correspond à une colonne connue
// du projet, la nouvelle valeur.
//
// Body: { changeRequestId: string, accept: boolean }
//
// ⚠️ Simplification assumée : le projet reprend en statut "IN_PRODUCTION"
// après réponse, quel que soit son statut avant la demande. Un champ
// `status_before_change` sur `projects_artisan` serait nécessaire pour une
// reprise fidèle à l'état exact précédent — non modélisé en v1.

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Body {
  changeRequestId: string;
  accept: boolean;
}

const FIELD_TO_COLUMN: Record<string, string> = {
  materiaux: "materiaux",
  dimensions: "dimensions",
  delai: "delai_final",
  quantite: "quantite",
  livraison_adresse: "livraison_adresse",
};

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const { changeRequestId, accept } = await parseJson<Body>(req);
    if (!changeRequestId || typeof accept !== "boolean") {
      throw new HttpError(400, "changeRequestId et accept requis");
    }

    const admin = adminClient();
    const { data: cr } = await admin
      .from("project_artisan_change_requests")
      .select("*")
      .eq("id", changeRequestId)
      .single();
    if (!cr) throw new HttpError(404, "Demande introuvable");
    if (cr.status !== "CHANGE_REQUESTED") {
      throw new HttpError(409, `Cette demande est déjà "${cr.status}"`);
    }

    const { data: project } = await admin
      .from("projects_artisan")
      .select("id, client_id, artisan_id, price_final, title")
      .eq("id", cr.project_id)
      .single();
    if (!project) throw new HttpError(404, "Projet introuvable");

    const { data: artisanRow } = await admin
      .from("artisans")
      .select("profile_id")
      .eq("id", project.artisan_id)
      .single();
    const isClient = project.client_id === user.id;
    const isArtisan = artisanRow?.profile_id === user.id;
    if (!isClient && !isArtisan) throw new HttpError(403, "Vous n'êtes pas partie prenante de ce projet");
    if (user.id === cr.requested_by) {
      throw new HttpError(403, "Vous ne pouvez pas répondre à votre propre demande");
    }

    await admin
      .from("project_artisan_change_requests")
      .update({ status: accept ? "CHANGE_ACCEPTED" : "CHANGE_REJECTED" })
      .eq("id", changeRequestId);

    if (accept) {
      const updates: Record<string, unknown> = { status: "IN_PRODUCTION" };
      if (cr.price_impact) updates.price_final = project.price_final + cr.price_impact;
      const column = FIELD_TO_COLUMN[cr.field];
      if (column) updates[column] = cr.new_value;
      await admin.from("projects_artisan").update(updates).eq("id", project.id);
    } else {
      await admin.from("projects_artisan").update({ status: "IN_PRODUCTION" }).eq("id", project.id);
    }

    await notify(admin, {
      userId: cr.requested_by,
      type: "project",
      title: accept ? "Modification acceptée" : "Modification refusée",
      description: `« ${project.title} » — ${cr.label ?? cr.field}`,
      route: { page: "projet-artisan-detail", projectId: project.id },
      linkedId: project.id,
    });

    return json({ success: true, status: accept ? "CHANGE_ACCEPTED" : "CHANGE_REJECTED" });
  }),
);
