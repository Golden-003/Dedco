// POST /send-push
// Ne PAS appeler depuis le client. Déclenchée par un Database Webhook
// Supabase sur `INSERT` de la table `notifications` (configuré dans
// Dashboard → Database → Webhooks — voir le guide d'utilisation).
//
// Sécurité : le Database Webhook doit être configuré pour envoyer un header
// `X-Webhook-Secret` égal au secret `DB_WEBHOOK_SECRET` défini ci-dessous —
// cette fonction est déployée avec --no-verify-jwt (le webhook Postgres
// n'envoie pas de JWT Supabase) donc cette vérification est la seule
// protection contre un appel public arbitraire.

import { json } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { sendExpoPush } from "../_shared/push.ts";

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  route: Record<string, unknown> | null;
}

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: NotificationRow;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = req.headers.get("X-Webhook-Secret");
  if (secret !== Deno.env.get("DB_WEBHOOK_SECRET")) {
    return json({ error: "unauthorized" }, 401);
  }

  const payload = (await req.json()) as WebhookPayload;
  if (payload.table !== "notifications" || payload.type !== "INSERT") {
    return json({ skipped: true });
  }

  const admin = adminClient();
  const { data: tokens } = await admin
    .from("device_tokens")
    .select("token")
    .eq("user_id", payload.record.user_id);

  if (tokens?.length) {
    await sendExpoPush(
      tokens.map((t: { token: string }) => t.token),
      payload.record.title,
      payload.record.description ?? "",
      { route: payload.record.route, notificationId: payload.record.id },
    );
  }

  return json({ sent: tokens?.length ?? 0 });
});
