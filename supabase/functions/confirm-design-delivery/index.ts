// POST /confirm-design-delivery
// Le client valide les livrables finaux d'un projet designer → libère le
// solde du wallet designer.
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
      .from("design_projects")
      .select("*")
      .eq("id", projectId)
      .single();
    if (!project || project.client_id !== user.id) throw new HttpError(404, "Projet introuvable");
    if (project.status !== "DELIVERED_PENDING_VALIDATION") {
      throw new HttpError(409, `Impossible de valider un projet au statut "${project.status}"`);
    }

    await admin.from("design_projects").update({ status: "COMPLETED", solde: 0 }).eq("id", projectId);

    const { data: pendingTxns } = await admin
      .from("wallet_transactions")
      .select("id")
      .eq("related_project_id", projectId)
      .eq("related_project_type", "design")
      .eq("status", "pending");

    for (const txn of pendingTxns ?? []) {
      const { error: releaseErr } = await admin.rpc("release_wallet_transaction", { p_txn_id: txn.id });
      if (releaseErr) {
        console.error(`[confirm-design-delivery] release_wallet_transaction failed for ${txn.id}:`, releaseErr.message);
      }
    }

    // Le solde restant (prix - acompte déjà versé) est dû au designer via un
    // second paiement client (hors scope v1 — le workflow actuel ne couvre
    // que l'acompte). On journalise malgré tout le solde pour visibilité.
    if (project.solde > 0) {
      const { data: wallet } = await admin
        .from("wallets")
        .select("id")
        .eq("owner_type", "designer")
        .eq("owner_id", project.designer_id)
        .single();
      if (wallet) {
        await admin.from("wallet_transactions").insert({
          wallet_id: wallet.id,
          type: "credit",
          label: `Solde final — ${project.title}`,
          amount: project.solde,
          status: "pending",
          related_project_id: projectId,
          related_project_type: "design",
        });
      }
    }

    const { data: designerRow } = await admin
      .from("designers")
      .select("profile_id")
      .eq("id", project.designer_id)
      .single();
    if (designerRow?.profile_id) {
      await notify(admin, {
        userId: designerRow.profile_id,
        type: "payment",
        title: "Projet validé",
        description: `Le client a validé « ${project.title} ».`,
        route: { page: "designer-wallet" },
        linkedId: project.id,
      });
    }

    return json({ success: true, status: "COMPLETED" });
  }),
);
