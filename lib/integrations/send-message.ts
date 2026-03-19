import type { Platform } from "@/lib/generated/prisma/client";
import { sendLineMessage, sendLineReply, buildLineButtonMessage, type LineCredentials, type LineMessage, type LineSendResult } from "./line";
import { sendFacebookMessage, type FacebookCredentials } from "./facebook";
import { sendInstagramMessage } from "./instagram";
import { sendWhatsAppMessage, type WhatsAppCredentials } from "./whatsapp";

export interface SendMessageParams {
  platform: Platform | string;
  credentials: unknown;
  recipientId: string;
  text?: string;
  imageUrl?: string;
}

export async function sendPlatformMessage(params: SendMessageParams): Promise<boolean> {
  const { platform, credentials, recipientId, text, imageUrl } = params;
  const creds = credentials as Record<string, string>;

  switch (platform) {
    case "line": {
      const lineCreds: LineCredentials = {
        channelId: creds.channelId ?? "",
        channelSecret: creds.channelSecret ?? "",
        channelAccessToken: creds.channelAccessToken ?? "",
      };
      const messages: LineMessage[] = imageUrl
        ? [{ type: "image", originalContentUrl: imageUrl, previewImageUrl: imageUrl }]
        : [{ type: "text", text: text ?? "" }];
      const result = await sendLineMessage(lineCreds, recipientId, messages);
      return result.ok;
    }

    case "facebook": {
      const fbCreds: FacebookCredentials = {
        pageId: creds.pageId ?? "",
        pageAccessToken: creds.pageAccessToken ?? "",
        appSecret: creds.appSecret ?? "",
        verifyToken: creds.verifyToken ?? "",
      };
      const message = imageUrl
        ? { attachment: { type: "image" as const, payload: { url: imageUrl } } }
        : { text: text ?? "" };
      return sendFacebookMessage(fbCreds, recipientId, message);
    }

    case "instagram": {
      const igCreds = {
        igAccessToken: creds.igAccessToken ?? undefined,
        igAccountId: creds.igAccountId ?? undefined,
        pageAccessToken: creds.pageAccessToken ?? undefined,
        pageId: creds.pageId ?? undefined,
        appSecret: creds.appSecret ?? "",
        verifyToken: creds.verifyToken ?? "",
      };
      const message = imageUrl
        ? { attachment: { type: "image" as const, payload: { url: imageUrl } } }
        : { text: text ?? "" };
      return sendInstagramMessage(igCreds, recipientId, message);
    }

    case "whatsapp": {
      const waCreds: WhatsAppCredentials = {
        wabaId: creds.wabaId ?? "",
        phoneNumberId: creds.phoneNumberId ?? "",
        accessToken: creds.accessToken ?? "",
        verifyToken: creds.verifyToken ?? "",
        appSecret: creds.appSecret ?? "",
      };
      return sendWhatsAppMessage(waCreds, recipientId, imageUrl
        ? { mediaUrl: imageUrl, mediaType: "image" }
        : { text: text ?? "" });
    }

    default:
      return false;
  }
}

// ─── Rich Message Types ──────────────────────────────────────────────────────

export interface RichButton {
  label: string;
  action: "postback" | "url" | "message";
  value: string;
}

export interface AutoReplyMessage {
  type: "text" | "image" | "card" | "sticker" | "file" | "video";
  text?: string;
  buttons?: RichButton[];
  imageUrl?: string;
  cardTitle?: string;
  cardText?: string;
  cardImageUrl?: string;
  cardButtons?: RichButton[];
  stickerPackageId?: string;
  stickerId?: string;
  fileUrl?: string;
  fileName?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface SendResult { ok: boolean; error?: string }

export async function sendAutoReplyMessage(params: {
  platform: Platform | string;
  credentials: unknown;
  recipientId: string;
  message: AutoReplyMessage;
  replyToken?: string;
}): Promise<SendResult> {
  const { platform, credentials, recipientId, message: msg, replyToken } = params;

  const sendLine = async (creds: LineCredentials, messages: LineMessage[]): Promise<SendResult> => {
    let result: LineSendResult | undefined;
    if (replyToken) {
      result = await sendLineReply(creds, replyToken, messages);
      if (result.ok) return { ok: true };
      console.warn(`[AutoReply] Reply API failed (${result.status}), trying Push API`);
    }
    result = await sendLineMessage(creds, recipientId, messages);
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  };

  switch (msg.type) {
    case "text": {
      if (!msg.text && !msg.buttons?.length) {
        return { ok: false, error: "Empty text message" };
      }
      if (msg.buttons?.length && platform === "line") {
        const creds = credentials as unknown as LineCredentials;
        const flex = buildLineButtonMessage(
          msg.text ?? "",
          msg.buttons.map((b) => ({
            label: b.label,
            type: b.action as "postback" | "uri" | "message",
            data: b.action === "postback" ? b.value : undefined,
            uri: b.action === "url" ? b.value : undefined,
            text: b.action === "message" ? b.value : undefined,
          }))
        );
        return sendLine(creds, [flex as unknown as LineMessage]);
      }
      if (msg.buttons?.length && (platform === "facebook" || platform === "instagram")) {
        const fbMsg = {
          attachment: {
            type: "template" as const,
            payload: {
              template_type: "button",
              text: msg.text ?? "",
              buttons: msg.buttons.map((b) =>
                b.action === "url"
                  ? { type: "web_url", title: b.label, url: b.value }
                  : { type: "postback", title: b.label, payload: b.value }
              ),
            },
          },
        };
        const ok = await sendPlatformFbMessage(credentials, platform, recipientId, fbMsg);
        return ok ? { ok: true } : { ok: false, error: `${platform} API failed` };
      }
      const ok = await sendPlatformMessage({ platform, credentials, recipientId, text: msg.text });
      return ok ? { ok: true } : { ok: false, error: `${platform} text send failed` };
    }

    case "image": {
      if (!msg.imageUrl) {
        return { ok: false, error: "Image message missing URL" };
      }
      if (platform === "line") {
        const creds = credentials as unknown as LineCredentials;
        return sendLine(creds, [{ type: "image", originalContentUrl: msg.imageUrl, previewImageUrl: msg.imageUrl }]);
      }
      const ok = await sendPlatformMessage({ platform, credentials, recipientId, imageUrl: msg.imageUrl });
      return ok ? { ok: true } : { ok: false, error: `${platform} image send failed` };
    }

    case "card": {
      if (platform === "line") {
        const creds = credentials as unknown as LineCredentials;
        const bodyContents: Record<string, unknown>[] = [];
        if (msg.cardTitle) bodyContents.push({ type: "text", text: msg.cardTitle, weight: "bold", size: "lg" });
        if (msg.cardText) bodyContents.push({ type: "text", text: msg.cardText, wrap: true, size: "sm", margin: "md" });
        if (bodyContents.length === 0) bodyContents.push({ type: "text", text: "(empty)", size: "sm", color: "#999999" });

        const bubble: LineMessage = {
          type: "flex",
          altText: msg.cardTitle ?? "Card",
          contents: {
            type: "bubble",
            ...(msg.cardImageUrl ? {
              hero: { type: "image", url: msg.cardImageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover" },
            } : {}),
            body: { type: "box", layout: "vertical", contents: bodyContents },
            ...(msg.cardButtons?.length ? {
              footer: {
                type: "box", layout: "vertical", spacing: "sm",
                contents: msg.cardButtons.map((b) => ({
                  type: "button", style: "primary",
                  action: b.action === "url"
                    ? { type: "uri", label: b.label, uri: b.value }
                    : b.action === "postback"
                      ? { type: "postback", label: b.label, data: b.value, displayText: b.label }
                      : { type: "message", label: b.label, text: b.value },
                })),
              },
            } : {}),
          },
        };
        return sendLine(creds, [bubble]);
      }
      if (platform === "facebook" || platform === "instagram") {
        const fbMsg = {
          attachment: {
            type: "template" as const,
            payload: {
              template_type: "generic",
              elements: [{
                title: msg.cardTitle ?? "",
                subtitle: msg.cardText ?? undefined,
                image_url: msg.cardImageUrl ?? undefined,
                buttons: (msg.cardButtons ?? []).map((b) =>
                  b.action === "url"
                    ? { type: "web_url", title: b.label, url: b.value }
                    : { type: "postback", title: b.label, payload: b.value }
                ),
              }],
            },
          },
        };
        const ok = await sendPlatformFbMessage(credentials, platform, recipientId, fbMsg);
        return ok ? { ok: true } : { ok: false, error: `${platform} card send failed` };
      }
      const ok = await sendPlatformMessage({ platform, credentials, recipientId, text: `${msg.cardTitle ?? ""}\n${msg.cardText ?? ""}` });
      return ok ? { ok: true } : { ok: false, error: `${platform} card fallback failed` };
    }

    case "sticker": {
      if (platform === "line") {
        const creds = credentials as unknown as LineCredentials;
        if (!msg.stickerPackageId || !msg.stickerId) return { ok: false, error: "Sticker missing packageId/stickerId" };
        return sendLine(creds, [{ type: "sticker", packageId: msg.stickerPackageId, stickerId: msg.stickerId }]);
      }
      return { ok: true };
    }

    case "file": {
      const ok = await sendPlatformMessage({ platform, credentials, recipientId, text: msg.fileName ? `[ไฟล์: ${msg.fileName}] ${msg.fileUrl}` : msg.fileUrl });
      return ok ? { ok: true } : { ok: false, error: "File send failed" };
    }

    case "video": {
      const ok = await sendPlatformMessage({ platform, credentials, recipientId, text: msg.videoUrl });
      return ok ? { ok: true } : { ok: false, error: "Video send failed" };
    }

    default:
      return { ok: false, error: `Unknown message type: ${msg.type}` };
  }
}

function sendPlatformFbMessage(credentials: unknown, platform: string, recipientId: string, message: unknown): Promise<boolean> {
  const creds = credentials as Record<string, string>;
  if (platform === "facebook") {
    return sendFacebookMessage(
      { pageId: creds.pageId ?? "", pageAccessToken: creds.pageAccessToken ?? "", appSecret: creds.appSecret ?? "", verifyToken: creds.verifyToken ?? "" },
      recipientId,
      message as { text?: string }
    );
  }
  return sendInstagramMessage(
    { igAccessToken: creds.igAccessToken, igAccountId: creds.igAccountId, pageAccessToken: creds.pageAccessToken, pageId: creds.pageId, appSecret: creds.appSecret ?? "", verifyToken: creds.verifyToken ?? "" },
    recipientId,
    message as { text?: string }
  );
}
