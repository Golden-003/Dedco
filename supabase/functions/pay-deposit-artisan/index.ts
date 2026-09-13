// POST /pay-deposit-artisan
// Ouvre le paiement FedaPay de l'acompte (50% du devis retenu). La création
// du projet (`projects_artisan`) et le crédit wallet ont lieu dans
// `fedapay-webhook` une fois le paiement confirmé.
//
// Body: { briefId: string, callbackUrl: string }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { createFedaPayCheckout } from "../_shared/fedapay.ts";

interface Body {
  briefId: string;
  callbackUrl: string;
}

const DEPOSIT_RATE = 0.5;

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const { briefId, callbackUrl } = await parseJson<Body>(req);
    if (!briefId || !callbackUrl) throw new HttpError(400, "briefId et callbackUrl requis");

    const admin = adminClient();
    const { data: brief } = await admin.from("briefs_artisan").select("*").eq("id", briefId).single();
    if (!brief || brief.client_id !== user.id) throw new HttpError(404, "Brief introuvable");
    if (!["ARTISAN_SELECTED", "AWAITING_DEPOSIT"].includes(brief.status)) {
      throw new HttpError(409, `Impossible de payer un acompte au statut "${brief.status}"`);
    }
    if (!brief.selected_proposal_id) throw new HttpError(409, "Aucune proposition sélectionnée");

    const { data: proposal } = await admin
      .from("brief_artisan_proposals")
      .select("*")
      .eq("id", brief.selected_proposal_id)
      .single();
    if (!proposal) throw new HttpError(404, "Proposition introuvable");

    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", user.id)
      .single();

    const deposit = Math.round(proposal.price * DEPOSIT_RATE);

    const { transactionId, checkoutUrl } = await createFedaPayCheckout({
      amount: deposit,
      description: `Acompte — ${brief.title}`,
      customerFirstName: profile?.first_name ?? "Client",
      customerLastName: profile?.last_name ?? "Dedco",
      customerPhone: profile?.phone ?? "",
      callbackUrl,
      metadata: {
        kind: "brief_artisan_deposit",
        briefId: brief.id,
        proposalId: proposal.id,
        userId: user.id,
      },
    });

    if (brief.status === "ARTISAN_SELECTED") {
      await admin.from("briefs_artisan").update({ status: "AWAITING_DEPOSIT" }).eq("id", briefId);
    }

    return json({ checkoutUrl, transactionId, depositAmount: deposit });
  }),
);
