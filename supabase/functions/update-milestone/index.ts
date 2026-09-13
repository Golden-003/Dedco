// POST /update-milestone
// L'artisan met à jour un jalon de fabrication (photos, % avancement,
// commentaire) et, si `markDone`, fait avancer le statut du projet.
//
// Body:
// {
//   projectId: string,
//   type: "PREPARATION" | "IN_PRODUCTION" | "READY_FOR_DELIVERY" | "DELIVERY",
//   percentage?: number, photos?: string[], comment?: string, markDone?: boolean
// }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

type MilestoneType = "PREPARATION" | "IN_PRODUCTION" | "READY_FOR_DELIVERY" | "DELIVERY";

interface Body {
  projectId: string;
  type: MilestoneType;
  percentage?: number;
  photos?: string[];
  comment?: string;
  markDone?: boolean;
}

// Statut du projet une fois le jalon marqué "done". La granularité
// "DELIVERY_SCHEDULED" / "IN_TRANSIT" reste un ajustement manuel de
// `projects_artisan.status` par l'artisan (PATCH direct, permis par RLS) —
// cette fonction ne gère que les transitions déclenchées par un jalon.
const NEXT_STATUS: Record<MilestoneType, string> = {
  PREPARATION: "IN_PRODUCTION",
  IN_PRODUCTION: "READY_FOR_DELIVERY",
  READY_FOR_DELIVERY: "DELIVERY_SCHEDULED",
  DELIVERY: "DELIVERED_PENDING_CONFIRMATION",
};

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const body = await parseJson<Body>(req);
    if (!body.projectId || !body.type) throw new HttpError(400, "projectId et type requis");

    const admin = adminClient();
    const { data: project } = await admin
      .from("projects_artisan")
      .select("id, artisan_id, client_id, status, title")
      .eq("id", body.projectId)
      .single();
    if (!project) throw new HttpError(404, "Projet introuvable");

    const { data: artisanRow } = await admin
      .from("artisans")
      .select("profile_id")
      .eq("id", project.artisan_id)
      .single();
    if (artisanRow?.profile_id !== user.id) {
      throw new HttpError(403, "Seul l'artisan du projet peut mettre à jour ce jalon");
    }

    const { error: msError } = await admin
      .from("project_artisan_milestones")
      .update({
        percentage: body.percentage ?? null,
        photos: body.photos ?? [],
        comment: body.comment ?? null,
        status: body.markDone ? "done" : "in_progress",
        completed_at: body.markDone ? new Date().toISOString() : null,
      })
      .eq("project_id", body.projectId)
      .eq("type", body.type);
    if (msError) throw new HttpError(500, msError.message);

    if (body.markDone) {
      const nextStatus = NEXT_STATUS[body.type];
      await admin.from("projects_artisan").update({ status: nextStatus }).eq("id", body.projectId);

      await notify(admin, {
        userId: project.client_id,
        type: "project",
        title: `Mise à jour — ${project.title}`,
        description: `Jalon « ${body.type} » complété. ${body.comment ?? ""}`.trim(),
        route: { page: "projet-artisan-detail", projectId: body.projectId },
        linkedId: project.id,
      });
    }

    return json({ success: true });
  }),
);
