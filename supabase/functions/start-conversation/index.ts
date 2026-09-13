// POST /start-conversation
// Crée (ou réutilise) un fil de messagerie lié à un contexte métier
// (projet, commande, litige) ou une conversation directe, et y ajoute les
// participants.
//
// Body:
// {
//   context: "project_artisan" | "design_project" | "order" | "direct" | "dispute",
//   contextId?: string,       // requis sauf pour "direct"
//   participantIds: string[]  // l'appelant est ajouté automatiquement
// }

import { HttpError, json, withErrorHandling } from "../_shared/http.ts";
import { adminClient, parseJson, requireUser } from "../_shared/supabase.ts";

type ConversationContext = "project_artisan" | "design_project" | "order" | "direct" | "dispute";

interface Body {
  context: ConversationContext;
  contextId?: string;
  participantIds: string[];
}

Deno.serve(
  withErrorHandling(async (req) => {
    const { user } = await requireUser(req);
    const body = await parseJson<Body>(req);
    if (!body.context) throw new HttpError(400, "context requis");
    if (body.context !== "direct" && !body.contextId) {
      throw new HttpError(400, "contextId requis pour ce type de conversation");
    }

    const admin = adminClient();
    const participantIds = [...new Set([user.id, ...(body.participantIds ?? [])])];

    if (body.context !== "direct") {
      const { data: existing } = await admin
        .from("conversations")
        .select("id")
        .eq("context", body.context)
        .eq("context_id", body.contextId!)
        .maybeSingle();
      if (existing) {
        await ensureParticipants(admin, existing.id, participantIds);
        return json({ conversationId: existing.id, created: false });
      }
    }

    const { data: conversation, error } = await admin
      .from("conversations")
      .insert({ context: body.context, context_id: body.contextId ?? null })
      .select()
      .single();
    if (error) throw new HttpError(500, error.message);

    await ensureParticipants(admin, conversation.id, participantIds);

    return json({ conversationId: conversation.id, created: true }, 201);
  }),
);

async function ensureParticipants(
  admin: ReturnType<typeof adminClient>,
  conversationId: string,
  userIds: string[],
) {
  await admin
    .from("conversation_participants")
    .upsert(
      userIds.map((userId) => ({ conversation_id: conversationId, user_id: userId })),
      { onConflict: "conversation_id,user_id", ignoreDuplicates: true },
    );
}
