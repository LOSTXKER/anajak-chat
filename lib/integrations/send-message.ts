import type { Platform } from "@/lib/generated/prisma/client";
import { sendLineMessage, type LineCredentials } from "./line";
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
