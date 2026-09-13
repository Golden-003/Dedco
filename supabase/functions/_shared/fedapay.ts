// Intégration FedaPay (MTN Mobile Money / Moov Money).
//
// ⚠️ À vérifier contre la documentation FedaPay au moment de l'implémentation
// (https://docs.fedapay.com) : les noms de champs ci-dessous correspondent à
// l'API v1 "Transactions" au moment de la rédaction, mais FedaPay peut faire
// évoluer son contrat. Teste en mode sandbox avant de brancher les clés live.
//
// Secrets requis (`supabase secrets set ...`) :
//   FEDAPAY_SECRET_KEY     — clé API secrète (sandbox ou live)
//   FEDAPAY_BASE_URL       — https://sandbox-api.fedapay.com/v1 ou https://api.fedapay.com/v1
//   FEDAPAY_WEBHOOK_SECRET — secret de signature configuré côté dashboard FedaPay

export type FedaPayCustomMetadata = Record<string, string>;

interface CreateTransactionInput {
  amount: number; // FCFA, entier
  description: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail?: string;
  customerPhone: string; // format local, ex: "97123456"
  callbackUrl: string; // URL de retour app mobile (deep link) ou web
  metadata: FedaPayCustomMetadata;
}

function baseUrl(): string {
  return Deno.env.get("FEDAPAY_BASE_URL") ?? "https://sandbox-api.fedapay.com/v1";
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${Deno.env.get("FEDAPAY_SECRET_KEY")}`,
    "Content-Type": "application/json",
  };
}

/** Crée une transaction FedaPay puis génère l'URL de paiement (checkout). */
export async function createFedaPayCheckout(
  input: CreateTransactionInput,
): Promise<{ transactionId: string; checkoutUrl: string }> {
  const txRes = await fetch(`${baseUrl()}/transactions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      description: input.description,
      amount: input.amount,
      currency: { iso: "XOF" },
      callback_url: input.callbackUrl,
      custom_metadata: input.metadata,
      customer: {
        firstname: input.customerFirstName,
        lastname: input.customerLastName,
        email: input.customerEmail,
        phone_number: { number: input.customerPhone, country: "bj" },
      },
    }),
  });
  if (!txRes.ok) {
    throw new Error(`FedaPay create transaction failed: ${await txRes.text()}`);
  }
  const tx = await txRes.json();
  const transactionId = String(tx["v1/transaction"]?.id ?? tx.id);

  const tokenRes = await fetch(
    `${baseUrl()}/transactions/${transactionId}/token`,
    { method: "POST", headers: authHeaders() },
  );
  if (!tokenRes.ok) {
    throw new Error(`FedaPay token generation failed: ${await tokenRes.text()}`);
  }
  const tokenBody = await tokenRes.json();
  const checkoutUrl = tokenBody.url as string;

  return { transactionId, checkoutUrl };
}

/** Vérifie la signature d'un webhook FedaPay (schéma "t=...,s=..." — cf. doc). */
export async function verifyFedaPaySignature(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  const secret = Deno.env.get("FEDAPAY_WEBHOOK_SECRET");
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=") as [string, string]),
  );
  const timestamp = parts["t"];
  const signature = parts["s"];
  if (!timestamp || !signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparaison à temps constant
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export interface FedaPayWebhookPayload {
  name: string; // ex: "transaction.approved", "transaction.declined"
  entity: {
    id: number;
    status: string;
    amount: number;
    custom_metadata?: FedaPayCustomMetadata;
  };
}