// POST /confirm-delivery-artisan
// Le client confirme la réception d'une pièce sur-mesure → le solde passe de
// "pending" à "completed" dans le wallet de l'artisan.
//
// Body: { projectId: string }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Body {
  projectId: string;
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const { projectId } = await parseJson<Body>(req);
    if (!projectId) throw new HttpError(400, "projectId requis");

    const admin = adminClient();
    const { data: project } = await admin
      .from("projects_artisan")
      .select("*")
      .eq("id", projectId)
      .single();
    if (!project || project.client_id !== user.id) throw new HttpError(404, "Projet introuvable");
    if (project.status !== "DELIVERED_PENDING_CONFIRMATION") {
      throw new HttpError(409, `Impossible de confirmer un projet au statut "${project.status}"`);
    }

    await admin.from("projects_artisan").update({ status: "DELIVERED_CONFIRMED" }).eq("id", projectId);

    const { data: pendingTxns } = await admin
      .from("wallet_transactions")
      .select("id")
      .eq("related_project_id", projectId)
      .eq("related_project_type", "artisan")
      .eq("status", "pending");

    for (const txn of pendingTxns ?? []) {
      const { error: releaseErr } = await admin.rpc("release_wallet_transaction", { p_txn_id: txn.id });
      if (releaseErr) {
        console.error(`[confirm-delivery-artisan] release_wallet_transaction failed for ${txn.id}:`, releaseErr.message);
      }
    }

    await admin.from("projects_artisan").update({ status: "PAYMENT_RELEASED" }).eq("id", projectId);

    const { data: artisanRow } = await admin
      .from("artisans")
      .select("profile_id")
      .eq("id", project.artisan_id)
      .single();
    if (artisanRow?.profile_id) {
      await notify(admin, {
        userId: artisanRow.profile_id,
        type: "payment",
        title: "Paiement versé",
        description: `Le solde de « ${project.title} » a été versé sur votre wallet.`,
        route: { page: "artisan-wallet" },
        linkedId: project.id,
      });
    }
    await notify(admin, {
      userId: project.client_id,
      type: "delivery",
      title: "Livraison confirmée",
      description: `Merci d'avoir confirmé « ${project.title} ». Vous pouvez maintenant laisser un avis.`,
      route: { page: "projet-artisan-detail", projectId: project.id },
    });

    return json({ success: true, status: "PAYMENT_RELEASED" });
  }),
);
