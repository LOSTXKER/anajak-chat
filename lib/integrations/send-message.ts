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
      const fbResult = await sendFacebookMessage(fbCreds, recipientId, message);
      return fbResult.ok;
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
        const validBtns = msg.buttons.filter((b) => b.label && b.value).slice(0, 3);
        if (validBtns.length > 0) {
          const fbMsg = {
            attachment: {
              type: "template" as const,
              payload: {
                template_type: "button",
                text: msg.text || "เลือกตัวเลือก",
                buttons: validBtns.map((b) =>
                  b.action === "url"
                    ? { type: "web_url", title: b.label, url: b.value }
                    : { type: "postback", title: b.label, payload: b.value }
                ),
              },
            },
          };
          return sendPlatformFbMessage(credentials, platform, recipientId, fbMsg);
        }
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
        const title = (msg.cardTitle || msg.cardText || "Message").slice(0, 80);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element: Record<string, any> = { title };
        if (msg.cardText && msg.cardText !== title) element.subtitle = msg.cardText.slice(0, 80);
        if (msg.cardImageUrl) element.image_url = msg.cardImageUrl;
        const btns = (msg.cardButtons ?? []).filter((b) => b.label && b.value);
        if (btns.length > 0) {
          element.buttons = btns.slice(0, 3).map((b) =>
            b.action === "url"
              ? { type: "web_url", title: b.label, url: b.value }
              : { type: "postback", title: b.label, payload: b.value }
          );
        }
        const fbMsg = {
          attachment: {
            type: "template" as const,
            payload: { template_type: "generic", elements: [element] },
          },
        };
        const templateResult = await sendPlatformFbMessage(credentials, platform, recipientId, fbMsg);
        if (templateResult.ok) return templateResult;

        console.warn(`[SendMsg] Card template failed (${templateResult.error}), falling back to text`);
        const fallbackText = [msg.cardTitle, msg.cardText].filter(Boolean).join("\n") || "Message";
        const fbFallback = await sendPlatformFbMessage(credentials, platform, recipientId, { text: fallbackText });
        if (fbFallback.ok) return fbFallback;
        return { ok: false, error: `Card: ${templateResult.error}` };
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

async function sendPlatformFbMessage(credentials: unknown, platform: string, recipientId: string, message: unknown): Promise<SendResult> {
  const creds = credentials as Record<string, string>;
  try {
    if (platform === "facebook") {
      const result = await sendFacebookMessage(
        { pageId: creds.pageId ?? "", pageAccessToken: creds.pageAccessToken ?? "", appSecret: creds.appSecret ?? "", verifyToken: creds.verifyToken ?? "" },
        recipientId,
        message as Record<string, unknown>
      );
      return result.ok ? { ok: true } : { ok: false, error: `FB: ${result.error ?? "unknown"}` };
    }
    const ok = await sendInstagramMessage(
      { igAccessToken: creds.igAccessToken, igAccountId: creds.igAccountId, pageAccessToken: creds.pageAccessToken, pageId: creds.pageId, appSecret: creds.appSecret ?? "", verifyToken: creds.verifyToken ?? "" },
      recipientId,
      message as { text?: string }
    );
    return ok ? { ok: true } : { ok: false, error: `Instagram API error` };
  } catch (e) {
    return { ok: false, error: `${platform} exception: ${e instanceof Error ? e.message : String(e)}` };
  }
}
