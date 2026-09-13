// POST /pay-deposit-designer
// Ouvre le paiement FedaPay de l'acompte designer (50% du devis accepté).
// La création de `design_projects` a lieu dans fedapay-webhook.
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
    const { data: brief } = await admin.from("briefs_designer").select("*").eq("id", briefId).single();
    if (!brief || brief.client_id !== user.id) throw new HttpError(404, "Brief introuvable");
    if (brief.status !== "AWAITING_PAYMENT") {
      throw new HttpError(409, `Impossible de payer un acompte au statut "${brief.status}"`);
    }

    const { data: historyRow } = await admin
      .from("brief_designer_history")
      .select("metadata")
      .eq("brief_id", briefId)
      .eq("action", "accept")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    const quote = historyRow?.metadata as { prix?: number } | undefined;
    if (!quote?.prix) throw new HttpError(409, "Aucun devis trouvé pour ce brief");

    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", user.id)
      .single();

    const deposit = Math.round(quote.prix * DEPOSIT_RATE);

    const { transactionId, checkoutUrl } = await createFedaPayCheckout({
      amount: deposit,
      description: `Acompte prestation designer — brief ${brief.display_id}`,
      customerFirstName: profile?.first_name ?? "Client",
      customerLastName: profile?.last_name ?? "Dedco",
      customerPhone: profile?.phone ?? "",
      callbackUrl,
      metadata: { kind: "brief_designer_deposit", briefId: brief.id, userId: user.id },
    });

    return json({ checkoutUrl, transactionId, depositAmount: deposit });
  }),
);
