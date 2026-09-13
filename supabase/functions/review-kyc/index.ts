// POST /review-kyc — admin uniquement
// Valide ou rejette une soumission KYC, et répercute le statut sur le profil.
//
// Body: { submissionId: string, decision: "verified" | "rejected", rejectionReason?: string }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { parseJson, requireAdmin } from "../_shared/supabase.ts";
import { notify } from "../_shared/notify.ts";

interface Body {
  submissionId: string;
  decision: "verified" | "rejected";
  rejectionReason?: string;
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { user, admin } = await requireAdmin(req);
    const body = await parseJson<Body>(req);
    if (!body.submissionId || !body.decision) throw new HttpError(400, "submissionId et decision requis");
    if (body.decision === "rejected" && !body.rejectionReason) {
      throw new HttpError(400, "rejectionReason requis en cas de rejet");
    }

    const { data: submission } = await admin
      .from("kyc_submissions")
      .select("*")
      .eq("id", body.submissionId)
      .single();
    if (!submission) throw new HttpError(404, "Soumission introuvable");

    await admin
      .from("kyc_submissions")
      .update({
        status: body.decision,
        rejection_reason: body.decision === "rejected" ? body.rejectionReason : null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", body.submissionId);

    await admin.from("profiles").update({ kyc_status: body.decision }).eq("id", submission.user_id);

    await notify(admin, {
      userId: submission.user_id,
      type: "system",
      title: body.decision === "verified" ? "Identité vérifiée" : "Vérification refusée",
      description: body.decision === "verified"
        ? "Votre identité a été validée. Vous pouvez publier vos produits."
        : `Motif : ${body.rejectionReason}`,
      route: { page: "kyc" },
    });

    return json({ success: true, status: body.decision });
  }),
);
