import { sendFacebookMessage, verifyFacebookWebhook } from "./facebook";
import type { FacebookCredentials, FacebookAttachment, FacebookReferral } from "./facebook";

export type InstagramCredentials = FacebookCredentials;

export async function sendInstagramMessage(
  credentials: InstagramCredentials,
  recipientIgsid: string,
  message: { text?: string; attachment?: FacebookAttachment }
): Promise<boolean> {
  // Instagram DM uses the same Messenger Platform send API but through the Instagram account ID
  return sendFacebookMessage(credentials, recipientIgsid, message);
}

export { verifyFacebookWebhook as verifyInstagramWebhook };

export interface InstagramMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: { url?: string };
    }>;
  };
  referral?: FacebookReferral;
}

export interface InstagramWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging?: InstagramMessagingEvent[];
    changes?: Array<{
      value: {
        messaging?: InstagramMessagingEvent[];
      };
      field: string;
    }>;
  }>;
}

export async function getInstagramAccountName(pageAccessToken: string, igAccountId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}?fields=username&access_token=${pageAccessToken}`
    );
    if (!res.ok) return null;
    const data = await res.json() as { username: string };
    return data.username;
  } catch {
    return null;
  }
}

export function buildInstagramOAuthUrl(
  appId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "instagram_business_manage_messages,instagram_business_basic,pages_show_list",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}
