// POST /confirm-delivery
// Le client confirme la réception d'une commande marketplace. Libère le
// paiement en attente vers le(s) wallet(s) artisan concerné(s).
//
// Body: { orderId: string }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Body {
  orderId: string;
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const { orderId } = await parseJson<Body>(req);
    if (!orderId) throw new HttpError(400, "orderId requis");

    const admin = adminClient();
    const { data: order, error } = await admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (error || !order) throw new HttpError(404, "Commande introuvable");
    if (order.user_id !== user.id) throw new HttpError(403, "Cette commande ne vous appartient pas");
    if (order.status !== "expédié") {
      throw new HttpError(409, `Impossible de confirmer une commande au statut "${order.status}"`);
    }

    await admin
      .from("orders")
      .update({ status: "livré", delivered_at: new Date().toISOString() })
      .eq("id", orderId);

    await admin
      .from("order_timeline")
      .update({ done: true, happened_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .in("label", ["Préparation de l'expédition", "Expédié", "Livré"]);

    // Libère les transactions wallet en attente liées à cette commande.
    // release_wallet_transaction bascule le statut ET met à jour le solde
    // dans la même transaction Postgres — jamais l'un sans l'autre.
    const { data: pendingTxns } = await admin
      .from("wallet_transactions")
      .select("id")
      .eq("related_order_id", orderId)
      .eq("status", "pending");

    for (const txn of pendingTxns ?? []) {
      const { error: releaseErr } = await admin.rpc("release_wallet_transaction", { p_txn_id: txn.id });
      if (releaseErr) {
        console.error(`[confirm-delivery] release_wallet_transaction failed for ${txn.id}:`, releaseErr.message);
      }
    }

    await notify(admin, {
      userId: order.user_id,
      type: "delivery",
      title: "Livraison confirmée",
      description: `Merci d'avoir confirmé la réception de votre commande ${order.display_id}. Vous pouvez maintenant laisser un avis.`,
      route: { page: "order-history" },
    });

    return json({ success: true });
  }),
);
