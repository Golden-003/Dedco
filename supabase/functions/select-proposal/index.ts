// POST /select-proposal
// Le client retient une proposition d'artisan : les autres sont refusées
// automatiquement.
//
// Body: { briefId: string, proposalId: string }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Body {
  briefId: string;
  proposalId: string;
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const { briefId, proposalId } = await parseJson<Body>(req);
    if (!briefId || !proposalId) throw new HttpError(400, "briefId et proposalId requis");

    const admin = adminClient();
    const { data: brief } = await admin.from("briefs_artisan").select("*").eq("id", briefId).single();
    if (!brief || brief.client_id !== user.id) throw new HttpError(404, "Brief introuvable");
    if (!["PROPOSALS_RECEIVED", "IN_DISCUSSION"].includes(brief.status)) {
      throw new HttpError(409, `Impossible de sélectionner une proposition au statut "${brief.status}"`);
    }

    const { data: proposal } = await admin
      .from("brief_artisan_proposals")
      .select("*")
      .eq("id", proposalId)
      .eq("brief_id", briefId)
      .single();
    if (!proposal) throw new HttpError(404, "Proposition introuvable");
    if (proposal.status !== "pending") throw new HttpError(409, "Cette proposition n'est plus disponible");

    await admin
      .from("briefs_artisan")
      .update({ status: "ARTISAN_SELECTED", selected_proposal_id: proposalId })
      .eq("id", briefId);
    await admin.from("brief_artisan_proposals").update({ status: "accepted" }).eq("id", proposalId);
    await admin
      .from("brief_artisan_proposals")
      .update({ status: "rejected" })
      .eq("brief_id", briefId)
      .neq("id", proposalId);

    await admin.from("brief_artisan_history").insert({
      brief_id: briefId,
      action: "selectProposal",
      from_status: brief.status,
      to_status: "ARTISAN_SELECTED",
      actor_id: user.id,
      actor_role: "client",
    });

    const { data: allProposals } = await admin
      .from("brief_artisan_proposals")
      .select("id, artisan_id, status")
      .eq("brief_id", briefId);

    for (const p of allProposals ?? []) {
      const { data: artisanRow } = await admin.from("artisans").select("profile_id").eq("id", p.artisan_id).single();
      if (!artisanRow?.profile_id) continue;
      if (p.id === proposalId) {
        await notify(admin, {
          userId: artisanRow.profile_id,
          type: "brief_artisan",
          title: "Votre proposition a été retenue !",
          description: `Le client a sélectionné votre devis pour « ${brief.title} ». En attente du paiement de l'acompte.`,
          route: { page: "artisan-demandes" },
          linkedId: brief.id,
        });
      } else {
        await notify(admin, {
          userId: artisanRow.profile_id,
          type: "brief_artisan",
          title: "Proposition non retenue",
          description: `Le client a choisi un autre artisan pour « ${brief.title} ».`,
          linkedId: brief.id,
        });
      }
    }

    return json({ success: true, status: "ARTISAN_SELECTED" });
  }),
);
