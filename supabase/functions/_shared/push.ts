// Envoi de notifications push via l'API Expo (app React Native / Expo).
// Doc : https://docs.expo.dev/push-notifications/sending-notifications/
//
// Secret optionnel : EXPO_ACCESS_TOKEN (recommandé en prod pour éviter le
// rate-limit anonyme de l'API Expo).

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
}

/** Envoie une notification à une liste de device tokens (par lots de 100, limite Expo). */
export async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const validTokens = tokens.filter((t) => t.startsWith("ExponentPushToken"));
  if (validTokens.length === 0) return;

  const messages: ExpoMessage[] = validTokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound: "default",
  }));

  const accessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      console.error("[expo-push] batch failed:", await res.text());
    }
  }
}