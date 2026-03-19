import crypto from "crypto";

export interface LineCredentials {
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
}

export interface LineTextMessage { type: "text"; text: string }
export interface LineImageMessage { type: "image"; originalContentUrl: string; previewImageUrl: string }
export interface LineStickerMessage { type: "sticker"; packageId: string; stickerId: string }
export interface LineFlexMessage { type: "flex"; altText: string; contents: Record<string, unknown> }

export type LineMessage = LineTextMessage | LineImageMessage | LineStickerMessage | LineFlexMessage;

export interface LineSendResult { ok: boolean; status: number; error?: string }

export async function sendLineMessage(
  credentials: LineCredentials,
  to: string,
  messages: LineMessage[]
): Promise<LineSendResult> {
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.channelAccessToken}`,
      },
      body: JSON.stringify({ to, messages }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const error = `[LINE Push] ${res.status}: ${body}`;
      console.error(error);
      return { ok: false, status: res.status, error };
    }
    return { ok: true, status: 200 };
  } catch (e) {
    const error = `[LINE Push] Network error: ${e instanceof Error ? e.message : String(e)}`;
    console.error(error);
    return { ok: false, status: 0, error };
  }
}

export async function sendLineReply(
  credentials: LineCredentials,
  replyToken: string,
  messages: LineMessage[]
): Promise<LineSendResult> {
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.channelAccessToken}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const error = `[LINE Reply] ${res.status}: ${body}`;
      console.error(error);
      return { ok: false, status: res.status, error };
    }
    return { ok: true, status: 200 };
  } catch (e) {
    const error = `[LINE Reply] Network error: ${e instanceof Error ? e.message : String(e)}`;
    console.error(error);
    return { ok: false, status: 0, error };
  }
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

// ─── Rich Menu ────────────────────────────────────────────────────────────────

export interface RichMenuArea {
  bounds: { x: number; y: number; width: number; height: number };
  action: { type: "message" | "uri" | "postback"; label?: string; text?: string; uri?: string; data?: string };
}

export interface RichMenuRequest {
  size: { width: 2500; height: 1686 | 843 };
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: RichMenuArea[];
}

export async function createRichMenu(
  credentials: LineCredentials,
  menu: RichMenuRequest
): Promise<{ richMenuId: string } | { error: string }> {
  const res = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credentials.channelAccessToken}`,
    },
    body: JSON.stringify(menu),
  });
  if (!res.ok) return { error: `LINE API ${res.status}: ${await res.text()}` };
  return (await res.json()) as { richMenuId: string };
}

export async function uploadRichMenuImage(
  credentials: LineCredentials,
  richMenuId: string,
  imageBuffer: ArrayBuffer,
  contentType: string
): Promise<boolean> {
  const res = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      Authorization: `Bearer ${credentials.channelAccessToken}`,
    },
    body: imageBuffer,
  });
  return res.ok;
}

export async function setDefaultRichMenu(
  credentials: LineCredentials,
  richMenuId: string
): Promise<boolean> {
  const res = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${credentials.channelAccessToken}` },
  });
  return res.ok;
}

export async function deleteRichMenu(
  credentials: LineCredentials,
  richMenuId: string
): Promise<boolean> {
  const res = await fetch(`https://api.line.me/v2/bot/richmenu/${richMenuId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${credentials.channelAccessToken}` },
  });
  return res.ok;
}

export async function listRichMenus(
  credentials: LineCredentials
): Promise<Array<{ richMenuId: string; name: string; chatBarText: string; selected: boolean; size: { width: number; height: number }; areas: RichMenuArea[] }>> {
  const res = await fetch("https://api.line.me/v2/bot/richmenu/list", {
    headers: { Authorization: `Bearer ${credentials.channelAccessToken}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { richmenus: Array<{ richMenuId: string; name: string; chatBarText: string; selected: boolean; size: { width: number; height: number }; areas: RichMenuArea[] }> };
  return data.richmenus ?? [];
}

export async function getRichMenuImage(
  credentials: LineCredentials,
  richMenuId: string
): Promise<ArrayBuffer | null> {
  const res = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    headers: { Authorization: `Bearer ${credentials.channelAccessToken}` },
  });
  if (!res.ok) return null;
  return res.arrayBuffer();
}

export async function getDefaultRichMenuId(
  credentials: LineCredentials
): Promise<string | null> {
  const res = await fetch("https://api.line.me/v2/bot/user/all/richmenu", {
    headers: { Authorization: `Bearer ${credentials.channelAccessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { richMenuId: string };
  return data.richMenuId ?? null;
}

export async function removeDefaultRichMenu(
  credentials: LineCredentials
): Promise<boolean> {
  const res = await fetch("https://api.line.me/v2/bot/user/all/richmenu", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${credentials.channelAccessToken}` },
  });
  return res.ok;
}

// ─── Flex / Button Messages ──────────────────────────────────────────────────

export interface LineFlexButton {
  label: string;
  type: "postback" | "uri" | "message";
  data?: string;
  uri?: string;
  text?: string;
}

export function buildLineButtonMessage(text: string, buttons: LineFlexButton[]) {
  return {
    type: "flex" as const,
    altText: text,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text, wrap: true }],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: buttons.map((btn) => ({
          type: "button",
          style: "primary",
          action: btn.type === "uri"
            ? { type: "uri", label: btn.label, uri: btn.uri }
            : btn.type === "postback"
              ? { type: "postback", label: btn.label, data: btn.data, displayText: btn.label }
              : { type: "message", label: btn.label, text: btn.text ?? btn.label },
        })),
      },
    },
  };
}

// ─── Webhook Types ────────────────────────────────────────────────────────────

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
  postback?: {
    data: string;
    params?: Record<string, string>;
  };
}

export interface LineWebhookBody {
  destination: string;
  events: LineWebhookEvent[];
}
