// POST /open-complaint
// Ouvre un litige sur une commande ou un projet (artisan ou designer).
//
// Body:
// {
//   orderId?: string,
//   projectId?: string, projectType?: "artisan" | "design",
//   motif: string, description?: string, attachments?: string[], amount?: number
// }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Body {
  orderId?: string;
  projectId?: string;
  projectType?: "artisan" | "design";
  motif: string;
  description?: string;
  attachments?: string[];
  amount?: number;
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const body = await parseJson<Body>(req);
    if (!body.motif) throw new HttpError(400, "motif requis");
    if (!body.orderId && !body.projectId) throw new HttpError(400, "orderId ou projectId requis");

    const admin = adminClient();
    let artisanId: string | null = null;
    let designerId: string | null = null;

    if (body.projectId) {
      if (body.projectType !== "artisan" && body.projectType !== "design") {
        throw new HttpError(400, "projectType requis (artisan | design)");
      }
      const table = body.projectType === "artisan" ? "projects_artisan" : "design_projects";
      const { data: project } = await admin.from(table).select("*").eq("id", body.projectId).single();
      if (!project || project.client_id !== user.id) throw new HttpError(404, "Projet introuvable");
      if (body.projectType === "artisan") {
        artisanId = project.artisan_id;
        await admin.from("projects_artisan").update({ status: "COMPLAINT_OPENED" }).eq("id", body.projectId);
      } else {
        designerId = project.designer_id;
        // Le statut design_projects n'a pas d'état "litige" dédié (v1) : le
        // dossier `disputes` fait foi indépendamment de son statut.
      }
    }

    if (body.orderId) {
      const { data: order } = await admin.from("orders").select("id, user_id").eq("id", body.orderId).single();
      if (!order || order.user_id !== user.id) throw new HttpError(404, "Commande introuvable");
      await admin.from("orders").update({ status: "litige" }).eq("id", body.orderId);
    }

    const { data: dispute, error } = await admin
      .from("disputes")
      .insert({
        user_id: user.id,
        order_id: body.orderId ?? null,
        project_id: body.projectId ?? null,
        project_type: body.projectType ?? null,
        artisan_id: artisanId,
        designer_id: designerId,
        motif: body.motif,
        description: body.description ?? null,
        attachments: body.attachments ?? [],
        amount: body.amount ?? null,
        status: "OPEN",
      })
      .select()
      .single();
    if (error) throw new HttpError(500, error.message);

    const professionalProfileId = artisanId
      ? (await admin.from("artisans").select("profile_id").eq("id", artisanId).single()).data?.profile_id
      : designerId
        ? (await admin.from("designers").select("profile_id").eq("id", designerId).single()).data?.profile_id
        : null;
    if (professionalProfileId) {
      await notify(admin, {
        userId: professionalProfileId,
        type: "litige",
        title: "Litige ouvert",
        description: body.motif,
        route: { page: "litige", id: dispute.display_id },
        linkedId: dispute.id,
      });
    }

    return json({ dispute }, 201);
  }),
);
