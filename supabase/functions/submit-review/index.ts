// POST /submit-review
// Vérifie que l'auteur a bien une commande livrée (marketplace) ou un projet
// terminé (sur-mesure) avant d'accepter l'avis — cf. `verified: true` sur la
// table `reviews`, qui n'a de sens que si c'est réellement contrôlé ici.
//
// Body:
// {
//   orderId?: string,
//   projectId?: string, projectType?: "artisan" | "design",
//   productId?: string, artisanId?: string, designerId?: string,
//   rating: number, subRatings?: { qualite, delais, communication },
//   comment?: string
// }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";

interface Body {
  orderId?: string;
  projectId?: string;
  projectType?: "artisan" | "design";
  productId?: string;
  artisanId?: string;
  designerId?: string;
  rating: number;
  subRatings?: { qualite: number; delais: number; communication: number };
  comment?: string;
}

const ARTISAN_PROJECT_REVIEWABLE = ["DELIVERED_CONFIRMED", "PAYMENT_RELEASED", "COMPLETED"];
const DESIGN_PROJECT_REVIEWABLE = ["COMPLETED"];

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const body = await parseJson<Body>(req);

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      throw new HttpError(400, "rating doit être entre 1 et 5");
    }
    if (!body.orderId && !body.projectId) {
      throw new HttpError(400, "orderId ou projectId requis");
    }

    const admin = adminClient();

    if (body.orderId) {
      const { data: order } = await admin
        .from("orders")
        .select("id, user_id, status")
        .eq("id", body.orderId)
        .single();
      if (!order || order.user_id !== user.id) throw new HttpError(404, "Commande introuvable");
      if (order.status !== "livré") {
        throw new HttpError(409, "La commande doit être livrée avant de laisser un avis");
      }
      let dedupQuery = admin.from("reviews").select("id").eq("order_id", body.orderId);
      dedupQuery = body.productId
        ? dedupQuery.eq("product_id", body.productId)
        : dedupQuery.is("product_id", null);
      const { data: existing } = await dedupQuery.maybeSingle();
      if (existing) throw new HttpError(409, "Vous avez déjà noté cet article");
    }

    if (body.projectId) {
      if (body.projectType !== "artisan" && body.projectType !== "design") {
        throw new HttpError(400, "projectType requis (artisan | design)");
      }
      const table = body.projectType === "artisan" ? "projects_artisan" : "design_projects";
      const validStatuses = body.projectType === "artisan" ? ARTISAN_PROJECT_REVIEWABLE : DESIGN_PROJECT_REVIEWABLE;
      const { data: project } = await admin
        .from(table)
        .select("id, client_id, status")
        .eq("id", body.projectId)
        .single();
      if (!project || project.client_id !== user.id) throw new HttpError(404, "Projet introuvable");
      if (!validStatuses.includes(project.status)) {
        throw new HttpError(409, "Le projet doit être terminé avant de laisser un avis");
      }
      const { data: existing } = await admin
        .from("reviews")
        .select("id")
        .eq("project_id", body.projectId)
        .eq("project_type", body.projectType)
        .maybeSingle();
      if (existing) throw new HttpError(409, "Vous avez déjà noté ce projet");
    }

    const { data: review, error } = await admin
      .from("reviews")
      .insert({
        order_id: body.orderId ?? null,
        project_id: body.projectId ?? null,
        project_type: body.projectType ?? null,
        product_id: body.productId ?? null,
        artisan_id: body.artisanId ?? null,
        designer_id: body.designerId ?? null,
        author_id: user.id,
        rating: body.rating,
        sub_rating_qualite: body.subRatings?.qualite ?? null,
        sub_rating_delais: body.subRatings?.delais ?? null,
        sub_rating_communication: body.subRatings?.communication ?? null,
        comment: body.comment ?? null,
      })
      .select()
      .single();
    if (error) throw new HttpError(500, error.message);

    // Recalcule la moyenne + le nombre d'avis sur l'entité notée.
    if (body.productId) await recomputeRating(admin, "products", body.productId);
    if (body.artisanId) await recomputeRating(admin, "artisans", body.artisanId);
    if (body.designerId) await recomputeRating(admin, "designers", body.designerId);

    return json({ review }, 201);
  }),
);

async function recomputeRating(
  admin: ReturnType<typeof adminClient>,
  table: "products" | "artisans" | "designers",
  id: string,
) {
  const column = table === "products" ? "product_id" : table === "artisans" ? "artisan_id" : "designer_id";
  const { data: rows } = await admin.from("reviews").select("rating").eq(column, id);
  if (!rows || rows.length === 0) return;
  const avg = rows.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / rows.length;
  await admin
    .from(table)
    .update({ rating: Math.round(avg * 10) / 10, reviews_count: rows.length })
    .eq("id", id);
}
