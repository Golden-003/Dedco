// Helpers de réponse HTTP + CORS communs à toutes les Edge Functions.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** À appeler en tout début de handler : répond immédiatement au preflight CORS. */
export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Enrobe un handler : capture HttpError et erreurs génériques en réponse JSON propre. */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>,
) {
  return async (req: Request): Promise<Response> => {
    const preflight = handleOptions(req);
    if (preflight) return preflight;
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: err.message }, err.status);
      }
      console.error("[unhandled]", err);
      return json({ error: "Erreur interne du serveur" }, 500);
    }
  };
}