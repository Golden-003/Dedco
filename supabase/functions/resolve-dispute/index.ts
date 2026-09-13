// POST /resolve-dispute — admin uniquement
// Tranche un litige et, le cas échéant, débite le wallet du professionnel
// concerné pour rembourser le client (remboursement effectif hors wallet,
// via FedaPay refund ou virement manuel — hors scope de cette fonction).
//
// Body:
// { disputeId: string, decision: string, status: "RESOLVED" | "CLOSED", refundAmount?: number }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { parseJson, requireAdmin } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Body {
  disputeId: string;
  decision: string;
  status: "RESOLVED" | "CLOSED";
  refundAmount?: number;
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { admin } = await requireAdmin(req);
    const body = await parseJson<Body>(req);
    if (!body.disputeId || !body.decision || !body.status) {
      throw new HttpError(400, "disputeId, decision et status requis");
    }

    const { data: dispute } = await admin.from("disputes").select("*").eq("id", body.disputeId).single();
    if (!dispute) throw new HttpError(404, "Litige introuvable");

    // Le remboursement est traité AVANT de figer le statut du litige : s'il
    // échoue (solde insuffisant), le litige reste "en cours" plutôt que
    // "résolu" avec un remboursement qui n'a en réalité pas eu lieu.
    if (body.refundAmount && body.refundAmount > 0) {
      const ownerType = dispute.artisan_id ? "artisan" : dispute.designer_id ? "designer" : null;
      const ownerId = dispute.artisan_id ?? dispute.designer_id;
      if (ownerType && ownerId) {
        const { data: wallet } = await admin
          .from("wallets")
          .select("id")
          .eq("owner_type", ownerType)
          .eq("owner_id", ownerId)
          .single();
        if (wallet) {
          // Même garde-fou que request-withdrawal : le débit fait foi avant
          // toute écriture, pas l'inverse — un remboursement qui dépasse le
          // solde du professionnel est refusé plutôt que de créer un solde
          // négatif silencieux (à traiter alors comme une perte plateforme,
          // hors wallet).
          const { data: debited, error: debitErr } = await admin.rpc("adjust_wallet_balance", {
            p_wallet_id: wallet.id,
            p_delta: -body.refundAmount,
          });
          if (debitErr) throw new HttpError(500, debitErr.message);
          if (!debited) {
            throw new HttpError(
              409,
              "Solde du professionnel insuffisant pour ce remboursement — à traiter comme perte plateforme.",
            );
          }
          await admin.from("wallet_transactions").insert({
            wallet_id: wallet.id,
            type: "debit",
            label: `Remboursement litige ${dispute.display_id}`,
            amount: body.refundAmount,
            status: "completed",
          });
        }
      }
    }

    await admin
      .from("disputes")
      .update({
        status: body.status,
        dedco_decision: body.decision,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", body.disputeId);

    await notify(admin, {
      userId: dispute.user_id,
      type: "litige",
      title: "Décision rendue",
      description: body.decision,
      route: { page: "litige", id: dispute.display_id },
      linkedId: dispute.id,
    });

    const professionalProfileId = dispute.artisan_id
      ? (await admin.from("artisans").select("profile_id").eq("id", dispute.artisan_id).single()).data?.profile_id
      : dispute.designer_id
        ? (await admin.from("designers").select("profile_id").eq("id", dispute.designer_id).single()).data?.profile_id
        : null;
    if (professionalProfileId) {
      await notify(admin, {
        userId: professionalProfileId,
        type: "litige",
        title: "Décision rendue sur un litige",
        description: body.decision,
        linkedId: dispute.id,
      });
    }

    return json({ success: true, status: body.status });
  }),
);
