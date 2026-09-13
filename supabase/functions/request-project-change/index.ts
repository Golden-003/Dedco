// POST /request-project-change
// Ouvre une demande de modification (prix, délai, matière…) sur un projet
// artisan en cours. Peut être initiée par le client ou l'artisan ; notifie
// l'autre partie qui doit y répondre via /respond-project-change.
//
// Body:
// {
//   projectId: string, field: string, label?: string,
//   oldValue?: string, newValue: string, reason?: string,
//   priceImpact?: number, delayImpact?: string
// }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Body {
  projectId: string;
  field: string;
  label?: string;
  oldValue?: string;
  newValue: string;
  reason?: string;
  priceImpact?: number;
  delayImpact?: string;
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const body = await parseJson<Body>(req);
    if (!body.projectId || !body.field || !body.newValue) {
      throw new HttpError(400, "projectId, field et newValue requis");
    }

    const admin = adminClient();
    const { data: project } = await admin
      .from("projects_artisan")
      .select("id, client_id, artisan_id, status, title")
      .eq("id", body.projectId)
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

    const { data: changeRequest, error } = await admin
      .from("project_artisan_change_requests")
      .insert({
        project_id: body.projectId,
        field: body.field,
        label: body.label ?? body.field,
        old_value: body.oldValue ?? null,
        new_value: body.newValue,
        reason: body.reason ?? null,
        price_impact: body.priceImpact ?? 0,
        delay_impact: body.delayImpact ?? null,
        status: "CHANGE_REQUESTED",
        requested_by: user.id,
      })
      .select()
      .single();
    if (error) throw new HttpError(500, error.message);

    await admin.from("projects_artisan").update({ status: "CHANGE_REQUEST_PENDING" }).eq("id", body.projectId);

    const recipientId = isClient ? artisanRow?.profile_id : project.client_id;
    if (recipientId) {
      await notify(admin, {
        userId: recipientId,
        type: "project",
        title: `Modification proposée — ${project.title}`,
        description: `${body.label ?? body.field} : ${body.newValue}${body.reason ? ` (${body.reason})` : ""}`,
        route: { page: "projet-artisan-detail", projectId: project.id },
        linkedId: project.id,
      });
    }

    return json({ changeRequest }, 201);
  }),
);
