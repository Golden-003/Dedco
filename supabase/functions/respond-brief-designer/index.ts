// POST /respond-brief-designer
// Le designer répond à une demande directe d'un client. En cas
// d'acceptation, le devis (prix, scope, livrables…) est fourni ici et
// conservé dans `brief_designer_history.metadata` jusqu'au paiement de
// l'acompte (cf. /pay-deposit-designer et fedapay-webhook), moment où il
// sert à créer `design_projects`.
//
// Body:
// {
//   briefId: string,
//   action: "accept" | "decline" | "need_info",
//   message?: string,
//   quote?: {
//     prix: number, scope: "prototype"|"standard"|"premium", prestationLabel: string,
//     livrablesPromis: string[], revisionsIncluses: number,
//     budgetConseilMin?: number, budgetConseilMax?: number
//   }
// }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Quote {
  prix: number;
  scope: "prototype" | "standard" | "premium";
  prestationLabel: string;
  livrablesPromis: string[];
  revisionsIncluses: number;
  budgetConseilMin?: number;
  budgetConseilMax?: number;
}

interface Body {
  briefId: string;
  action: "accept" | "decline" | "need_info";
  message?: string;
  quote?: Quote;
}

const STATUS_BY_ACTION = {
  accept: "AWAITING_PAYMENT",
  decline: "DECLINED",
  need_info: "NEEDS_INFO",
} as const;

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const body = await parseJson<Body>(req);
    if (!body.briefId || !body.action) throw new HttpError(400, "briefId et action requis");
    if (body.action === "accept" && !body.quote) throw new HttpError(400, "quote requis pour accepter");

    const admin = adminClient();
    const { data: brief } = await admin.from("briefs_designer").select("*").eq("id", body.briefId).single();
    if (!brief) throw new HttpError(404, "Brief introuvable");

    const { data: designerRow } = await admin
      .from("designers")
      .select("profile_id")
      .eq("id", brief.designer_id)
      .single();
    if (designerRow?.profile_id !== user.id) throw new HttpError(403, "Ce brief ne vous est pas adressé");

    if (!["SUBMITTED", "PENDING_DESIGNER_RESPONSE", "NEEDS_INFO"].includes(brief.status)) {
      throw new HttpError(409, `Impossible de répondre à un brief au statut "${brief.status}"`);
    }

    const newStatus = STATUS_BY_ACTION[body.action];
    await admin.from("briefs_designer").update({ status: newStatus }).eq("id", body.briefId);
    await admin.from("brief_designer_history").insert({
      brief_id: body.briefId,
      action: body.action,
      from_status: brief.status,
      to_status: newStatus,
      actor_id: user.id,
      actor_role: "designer",
      metadata: body.action === "accept" ? body.quote : { message: body.message },
    });

    const titles: Record<Body["action"], string> = {
      accept: "Mission acceptée — réservez la prestation",
      decline: "Mission refusée",
      need_info: "Informations complémentaires demandées",
    };
    await notify(admin, {
      userId: brief.client_id,
      type: "brief_designer",
      title: titles[body.action],
      description: body.message ?? (body.action === "accept" ? body.quote?.prestationLabel : undefined),
      route: { page: "brief-designer-detail", briefId: brief.display_id },
      linkedId: brief.id,
    });

    return json({ success: true, status: newStatus });
  }),
);
