// POST /fedapay-webhook
// Callback public appelé par FedaPay après une tentative de paiement.
// Déployer avec --no-verify-jwt (FedaPay n'envoie pas de JWT Supabase) et
// vérifier IMPÉRATIVEMENT la signature avant toute écriture — c'est la
// surface d'attaque la plus sensible du système (elle peut créer des
// commandes/projets "payés" gratuitement si elle n'est pas protégée).
//
// Route selon `custom_metadata.kind` :
//  - "order"                 → confirme une commande marketplace
//  - "brief_artisan_deposit" → convertit un brief artisan en projet
//  - "brief_designer_deposit"→ convertit un brief designer en projet

import { json } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";
import {
  type FedaPayWebhookPayload,
  verifyFedaPaySignature,
} from "../_shared/fedapay.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const rawBody = await req.text();
  const signature = req.headers.get("X-FEDAPAY-SIGNATURE");
  const valid = await verifyFedaPaySignature(rawBody, signature);
  if (!valid) {
    console.error("[fedapay-webhook] invalid signature");
    return json({ error: "Signature invalide" }, 401);
  }

  const payload = JSON.parse(rawBody) as FedaPayWebhookPayload;
  const admin = adminClient();
  const metadata = payload.entity.custom_metadata ?? {};
  const approved = payload.name === "transaction.approved";
  const failed = payload.name === "transaction.declined" || payload.name === "transaction.canceled";

  try {
    if (metadata.kind === "order") {
      await handleOrderPayment(admin, metadata.orderId, payload.entity.id, approved, failed);
    } else if (metadata.kind === "brief_artisan_deposit") {
      if (approved) await handleArtisanDepositApproved(admin, metadata.briefId, metadata.proposalId, payload.entity.amount);
    } else if (metadata.kind === "brief_designer_deposit") {
      if (approved) await handleDesignerDepositApproved(admin, metadata.briefId, payload.entity.amount);
    } else {
      console.warn("[fedapay-webhook] unknown metadata.kind:", metadata.kind);
    }
  } catch (err) {
    console.error("[fedapay-webhook] processing error:", err);
    // On répond 200 quand même : FedaPay ré-essaierait indéfiniment sinon.
    // L'erreur reste dans les logs Supabase pour investigation manuelle.
  }

  return json({ received: true });
});

async function handleOrderPayment(
  admin: ReturnType<typeof adminClient>,
  orderId: string,
  transactionId: number,
  approved: boolean,
  failed: boolean,
) {
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) return;

  if (approved) {
    await admin.from("orders").update({ status: "payé" }).eq("id", orderId);
    await admin
      .from("order_timeline")
      .update({ done: true, happened_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .in("label", ["Commande créée", "Paiement en attente"]);

    await notify(admin, {
      userId: order.user_id,
      type: "payment",
      title: "Paiement confirmé",
      description: `Votre commande ${order.display_id} a été payée avec succès.`,
      route: { page: "order-tracking", id: order.id },
    });

    const { data: items } = await admin
      .from("order_items")
      .select("artisan_id, price, qty")
      .eq("order_id", orderId);

    for (const item of items ?? []) {
      if (!item.artisan_id) continue;
      const { data: wallet } = await admin
        .from("wallets")
        .select("id")
        .eq("owner_type", "artisan")
        .eq("owner_id", item.artisan_id)
        .single();
      if (!wallet) continue;
      await admin.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        type: "credit",
        label: `Vente — commande ${order.display_id}`,
        amount: item.price * item.qty,
        status: "pending", // libéré à la confirmation de réception (confirm-delivery)
        related_order_id: orderId,
      });
    }
  } else if (failed) {
    await admin.from("orders").update({ status: "annulé" }).eq("id", orderId);
    await notify(admin, {
      userId: order.user_id,
      type: "payment",
      title: "Paiement échoué",
      description: `Le paiement de la commande ${order.display_id} a échoué. Vous pouvez réessayer.`,
      route: { page: "cart" },
    });
  }
}

async function handleArtisanDepositApproved(
  admin: ReturnType<typeof adminClient>,
  briefId: string,
  proposalId: string,
  depositAmount: number,
) {
  const { data: brief } = await admin.from("briefs_artisan").select("*").eq("id", briefId).single();
  const { data: proposal } = await admin
    .from("brief_artisan_proposals")
    .select("*")
    .eq("id", proposalId)
    .single();
  if (!brief || !proposal) return;

  const { data: project, error } = await admin
    .from("projects_artisan")
    .insert({
      brief_id: brief.id,
      proposal_id: proposal.id,
      client_id: brief.client_id,
      artisan_id: proposal.artisan_id,
      status: "CONFIRMED",
      title: brief.title,
      price_initial: proposal.price,
      price_final: proposal.price,
      montant_paye: depositAmount,
      materiaux: proposal.materials,
      dimensions: brief.dimensions,
      delai_initial: proposal.delivery_time,
      delai_final: proposal.delivery_time,
    })
    .select()
    .single();
  if (error || !project) {
    console.error("[fedapay-webhook] project creation failed:", error?.message);
    return;
  }

  await admin
    .from("briefs_artisan")
    .update({ status: "CONVERTED_TO_PROJECT", linked_project_id: project.id })
    .eq("id", brief.id);

  const { data: wallet } = await admin
    .from("wallets")
    .select("id")
    .eq("owner_type", "artisan")
    .eq("owner_id", proposal.artisan_id)
    .single();
  if (wallet) {
    await admin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      type: "credit",
      label: `Acompte — ${brief.title}`,
      amount: depositAmount,
      status: "pending",
      related_project_id: project.id,
      related_project_type: "artisan",
    });
  }

  await notify(admin, {
    userId: brief.client_id,
    type: "payment",
    title: "Acompte payé",
    description: `Votre projet « ${brief.title} » a démarré.`,
    route: { page: "projet-artisan-detail", projectId: project.id },
  });

  const { data: artisanRow } = await admin
    .from("artisans")
    .select("profile_id")
    .eq("id", proposal.artisan_id)
    .single();
  if (artisanRow?.profile_id) {
    await notify(admin, {
      userId: artisanRow.profile_id,
      type: "payment",
      title: "Acompte reçu",
      description: `Acompte reçu pour « ${brief.title} ». Vous pouvez démarrer la fabrication.`,
      route: { page: "projet-artisan-detail", projectId: project.id },
    });
  }
}

async function handleDesignerDepositApproved(
  admin: ReturnType<typeof adminClient>,
  briefId: string,
  depositAmount: number,
) {
  const { data: brief } = await admin.from("briefs_designer").select("*").eq("id", briefId).single();
  if (!brief) return;

  const { data: historyRow } = await admin
    .from("brief_designer_history")
    .select("metadata")
    .eq("brief_id", briefId)
    .eq("action", "accept")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  const quote = (historyRow?.metadata ?? {}) as Record<string, unknown>;

  const { data: project, error } = await admin
    .from("design_projects")
    .insert({
      brief_id: brief.id,
      client_id: brief.client_id,
      designer_id: brief.designer_id,
      scope: quote.scope ?? "standard",
      status: "KICKOFF_SCHEDULED",
      title: `${brief.piece ?? "Projet"} — ${brief.style ?? ""}`.trim(),
      prestation_label: quote.prestationLabel ?? null,
      prix: quote.prix ?? depositAmount * 2,
      montant_paye: depositAmount,
      solde: Number(quote.prix ?? depositAmount * 2) - depositAmount,
      livrables_promis: quote.livrablesPromis ?? [],
      revisions_incluses: quote.revisionsIncluses ?? 0,
      piece: brief.piece,
      style: brief.style,
      superficie: brief.superficie,
      budget_conseil_min: quote.budgetConseilMin ?? null,
      budget_conseil_max: quote.budgetConseilMax ?? null,
    })
    .select()
    .single();
  if (error || !project) {
    console.error("[fedapay-webhook] design project creation failed:", error?.message);
    return;
  }

  await admin
    .from("briefs_designer")
    .update({ status: "CONVERTED_TO_DESIGN_PROJECT", linked_project_id: project.id })
    .eq("id", brief.id);

  const { data: wallet } = await admin
    .from("wallets")
    .select("id")
    .eq("owner_type", "designer")
    .eq("owner_id", brief.designer_id)
    .single();
  if (wallet) {
    await admin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      type: "credit",
      label: `Acompte — ${project.title}`,
      amount: depositAmount,
      status: "pending",
      related_project_id: project.id,
      related_project_type: "design",
    });
  }

  await notify(admin, {
    userId: brief.client_id,
    type: "payment",
    title: "Réservation confirmée",
    description: `Votre prestation « ${project.title} » est réservée.`,
    route: { page: "projet-designer-detail", projectId: project.id },
  });
}
