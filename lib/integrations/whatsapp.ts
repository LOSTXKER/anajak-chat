export interface WhatsAppCredentials {
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  appSecret: string;
}

export async function sendWhatsAppMessage(
  credentials: WhatsAppCredentials,
  to: string,
  message: { text?: string; mediaUrl?: string; mediaType?: "image" | "document" | "video" }
): Promise<boolean> {
  const body =
    message.text
      ? { messaging_product: "whatsapp", to, type: "text", text: { body: message.text } }
      : {
          messaging_product: "whatsapp",
          to,
          type: message.mediaType ?? "image",
          [message.mediaType ?? "image"]: { link: message.mediaUrl },
        };

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${credentials.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.accessToken}`,
      },
      body: JSON.stringify(body),
    }
  );
  return res.ok;
}

export function verifyWhatsAppWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  verifyToken: string
): string | null {
  if (mode === "subscribe" && token === verifyToken) return challenge;
  return null;
}

export function parseWhatsAppWebhook(body: WhatsAppWebhookBody): WhatsAppMessage[] {
  const messages: WhatsAppMessage[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;
      for (const msg of value.messages) {
        const contact = value.contacts?.find((c) => c.wa_id === msg.from);
        messages.push({
          wabaId: value.metadata?.phone_number_id ?? "",
          from: msg.from,
          displayName: contact?.profile?.name ?? msg.from,
          messageId: msg.id,
          timestamp: parseInt(msg.timestamp) * 1000,
          text: msg.text?.body ?? null,
          imageUrl:
            msg.type === "image" && msg.image ? `https://graph.facebook.com/v21.0/${msg.image.id}` : null,
          type: msg.type,
          referral: msg.referral,
        });
      }
    }
  }
  return messages;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WhatsAppMessage {
  wabaId: string;
  from: string;
  displayName: string;
  messageId: string;
  timestamp: number;
  text: string | null;
  imageUrl: string | null;
  type: string;
  referral?: {
    source_url?: string;
    source_id?: string;
    source_type?: string;
    ctwa_clid?: string;
    ad_source_url?: string;
  };
}

export interface WhatsAppWebhookBody {
  object?: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value: {
        messaging_product?: string;
        metadata?: { display_phone_number?: string; phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body?: string };
          image?: { id?: string; mime_type?: string };
          referral?: WhatsAppMessage["referral"];
        }>;
      };
      field?: string;
    }>;
  }>;
}
