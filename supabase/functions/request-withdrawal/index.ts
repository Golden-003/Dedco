// POST /request-withdrawal
// Un artisan ou designer demande un retrait vers son Mobile Money. Les fonds
// sont réservés immédiatement (débit du solde affiché) ; le virement effectif
// MTN/Moov reste un traitement manuel côté opérations pour la v1 (pas
// d'intégration payout automatisée).
//
// Body: { amount: number }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Body {
  amount: number;
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const { amount } = await parseJson<Body>(req);
    if (!amount || amount <= 0) throw new HttpError(400, "amount doit être positif");

    const admin = adminClient();

    const { data: artisan } = await admin.from("artisans").select("id").eq("profile_id", user.id).maybeSingle();
    const { data: designer } = await admin.from("designers").select("id").eq("profile_id", user.id).maybeSingle();
    const ownerType = artisan ? "artisan" : designer ? "designer" : null;
    const ownerId = artisan?.id ?? designer?.id;
    if (!ownerType || !ownerId) throw new HttpError(403, "Réservé aux artisans et designers");

    const { data: wallet } = await admin
      .from("wallets")
      .select("*")
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .single();
    if (!wallet) throw new HttpError(404, "Wallet introuvable");

    const { data: paymentMethod } = await admin
      .from("payment_methods")
      .select("provider, phone_number")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle();
    if (!paymentMethod) throw new HttpError(400, "Aucun moyen de paiement par défaut enregistré");

    // adjust_wallet_balance a un garde-fou plancher à 0 dans son propre WHERE
    // (voir schema.sql) : c'est LE contrôle qui fait foi, pas une simple
    // lecture préalable — deux demandes de retrait simultanées ne peuvent
    // jamais faire passer le solde sous zéro.
    const { data: debited, error: debitErr } = await admin.rpc("adjust_wallet_balance", {
      p_wallet_id: wallet.id,
      p_delta: -amount,
    });
    if (debitErr) throw new HttpError(500, debitErr.message);
    if (!debited) throw new HttpError(409, "Solde insuffisant");

    const { data: txn, error } = await admin
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        type: "debit",
        label: `Retrait ${paymentMethod.provider.toUpperCase()} — ${paymentMethod.phone_number}`,
        amount,
        status: "pending",
      })
      .select()
      .single();
    if (error) {
      // Le débit a réussi mais la trace en base a échoué : on restitue les
      // fonds plutôt que de laisser un débit sans transaction associée.
      await admin.rpc("adjust_wallet_balance", { p_wallet_id: wallet.id, p_delta: amount });
      throw new HttpError(500, error.message);
    }

    await notify(admin, {
      userId: user.id,
      type: "payment",
      title: "Demande de retrait enregistrée",
      description: `${amount.toLocaleString("fr-FR")} FCFA vers ${paymentMethod.phone_number}. Traitement sous 24-48h.`,
    });

    return json({ transaction: txn }, 201);
  }),
);
