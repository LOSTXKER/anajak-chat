import type { Platform } from "@/lib/generated/prisma/client";
import { sendLineMessage, sendLineReply, buildLineButtonMessage, type LineCredentials } from "./line";
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

/**
 * Unified message sender — routes to the correct platform API.
 * Replaces the if/else platform branching that was duplicated in 6+ locations.
 */
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
      const messages = imageUrl
        ? [{ type: "image" as const, originalContentUrl: imageUrl, previewImageUrl: imageUrl }]
        : [{ type: "text" as const, text: text ?? "" }];
      await sendLineMessage(lineCreds, recipientId, messages);
      return true;
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

// ─── Rich Message Sender (buttons, cards, quick replies) ─────────────────────

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

export async function sendAutoReplyMessage(params: {
  platform: Platform | string;
  credentials: unknown;
  recipientId: string;
  message: AutoReplyMessage;
  replyToken?: string;
}): Promise<boolean> {
  const { platform, credentials, recipientId, message: msg, replyToken } = params;

  const sendLine = async (creds: LineCredentials, messages: unknown[]) => {
    console.log(`[AutoReply] sendLine: recipientId=${recipientId}, messages=${JSON.stringify(messages).slice(0, 200)}, token=${creds.channelAccessToken ? creds.channelAccessToken.slice(0, 10) + "..." : "MISSING"}`);
    if (replyToken) {
      const ok = await sendLineReply(creds, replyToken, messages as never[]);
      if (ok) return true;
      console.warn("[AutoReply] Reply API failed, falling back to Push API");
    }
    return sendLineMessage(creds, recipientId, messages as never[]);
  };

  switch (msg.type) {
    case "text": {
      if (!msg.text && !msg.buttons?.length) {
        console.warn("[AutoReply] Skipping empty text message");
        return false;
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
        return sendLine(creds, [flex]);
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
        return sendPlatformFbMessage(credentials, platform, recipientId, fbMsg);
      }
      return sendPlatformMessage({ platform, credentials, recipientId, text: msg.text });
    }

    case "image": {
      if (!msg.imageUrl) {
        console.warn("[AutoReply] Skipping image message with no URL");
        return false;
      }
      if (platform === "line") {
        const creds = credentials as unknown as LineCredentials;
        return sendLine(creds, [{ type: "image", originalContentUrl: msg.imageUrl, previewImageUrl: msg.imageUrl }]);
      }
      return sendPlatformMessage({ platform, credentials, recipientId, imageUrl: msg.imageUrl });
    }

    case "card": {
      if (platform === "line") {
        const creds = credentials as unknown as LineCredentials;
        const bubble = {
          type: "flex" as const,
          altText: msg.cardTitle ?? "Card",
          contents: {
            type: "bubble",
            ...(msg.cardImageUrl ? {
              hero: { type: "image", url: msg.cardImageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover" },
            } : {}),
            body: {
              type: "box", layout: "vertical", contents: [
                ...(msg.cardTitle ? [{ type: "text", text: msg.cardTitle, weight: "bold", size: "lg" }] : []),
                ...(msg.cardText ? [{ type: "text", text: msg.cardText, wrap: true, size: "sm", margin: "md" }] : []),
              ],
            },
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
        return sendPlatformFbMessage(credentials, platform, recipientId, fbMsg);
      }
      return sendPlatformMessage({ platform, credentials, recipientId, text: `${msg.cardTitle ?? ""}\n${msg.cardText ?? ""}` });
    }

    case "sticker": {
      if (platform === "line") {
        const creds = credentials as unknown as LineCredentials;
        return sendLine(creds, [{ type: "sticker", packageId: msg.stickerPackageId, stickerId: msg.stickerId }]);
      }
      return true;
    }

    case "file":
      return sendPlatformMessage({ platform, credentials, recipientId, text: msg.fileName ? `[ไฟล์: ${msg.fileName}] ${msg.fileUrl}` : msg.fileUrl });

    case "video":
      return sendPlatformMessage({ platform, credentials, recipientId, text: msg.videoUrl });

    default:
      return false;
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
