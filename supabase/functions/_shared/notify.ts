// Création d'une notification in-app (insert dans `public.notifications`).
// L'envoi de la push correspondante est déclenché séparément par un Database
// Webhook Supabase branché sur cette table (cf. la fonction `send-push`).

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type NotificationType =
  | "brief_artisan"
  | "brief_designer"
  | "project"
  | "message"
  | "payment"
  | "delivery"
  | "review"
  | "system"
  | "litige"
  | "order";

export async function notify(
  admin: SupabaseClient,
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    description?: string;
    route?: Record<string, unknown>;
    linkedId?: string;
  },
): Promise<void> {
  const { error } = await admin.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    description: params.description ?? null,
    route: params.route ?? null,
    linked_id: params.linkedId ?? null,
  });
  if (error) console.error("[notify] insert failed:", error.message);
}