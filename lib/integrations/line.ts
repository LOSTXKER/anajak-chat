import crypto from "crypto";

export interface LineCredentials {
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
}

export interface LineTextMessage {
  type: "text";
  text: string;
}

export interface LineImageMessage {
  type: "image";
  originalContentUrl: string;
  previewImageUrl: string;
}

export type LineMessage = LineTextMessage | LineImageMessage;

export async function sendLineMessage(
  credentials: LineCredentials,
  to: string,
  messages: LineMessage[]
): Promise<boolean> {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credentials.channelAccessToken}`,
    },
    body: JSON.stringify({ to, messages }),
  });
  return res.ok;
}

export async function replyLineMessage(
  credentials: LineCredentials,
  replyToken: string,
  messages: LineMessage[]
): Promise<boolean> {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credentials.channelAccessToken}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  return res.ok;
}

export function verifyLineSignature(
  channelSecret: string,
  body: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function validateLineCredentials(
  credentials: LineCredentials
): Promise<{ valid: boolean; botName?: string; error?: string }> {
  try {
    const res = await fetch("https://api.line.me/v2/bot/info", {
      headers: { Authorization: `Bearer ${credentials.channelAccessToken}` },
    });
    if (!res.ok) {
      return { valid: false, error: "Invalid Channel Access Token" };
    }
    const data = await res.json() as { displayName: string };
    return { valid: true, botName: data.displayName };
  } catch {
    return { valid: false, error: "Connection failed" };
  }
}

export interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  source: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  timestamp: number;
  message?: {
    id: string;
    type: string;
    text?: string;
    contentProvider?: { type: string; originalContentUrl?: string };
  };
}

export interface LineWebhookBody {
  destination: string;
  events: LineWebhookEvent[];
}
