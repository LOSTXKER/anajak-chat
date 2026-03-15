import crypto from "crypto";

export interface FacebookCredentials {
  pageId: string;
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
}

export interface FacebookTextMessage {
  text: string;
}

export interface FacebookAttachment {
  type: "image" | "video" | "audio" | "file";
  payload: { url: string; is_reusable?: boolean };
}

export async function sendFacebookMessage(
  credentials: FacebookCredentials,
  recipientId: string,
  message: { text?: string; attachment?: FacebookAttachment }
): Promise<boolean> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/messages?access_token=${credentials.pageAccessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message,
        messaging_type: "RESPONSE",
      }),
    }
  );
  return res.ok;
}

export function verifyFacebookWebhook(
  appSecret: string,
  body: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(body)
    .digest("hex");
  return `sha256=${expected}` === signature;
}

export interface FacebookReferral {
  ref?: string;
  source?: string;
  type?: string;
  ad_id?: string;
  ads_context_data?: {
    ad_title?: string;
    photo_url?: string;
    video_url?: string;
    post_id?: string;
    product_id?: string;
  };
  ctwa_clid?: string;
}

export interface FacebookMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: { url?: string; sticker_id?: number };
    }>;
  };
  referral?: FacebookReferral;
  postback?: {
    title: string;
    payload: string;
    referral?: FacebookReferral;
  };
}

export interface FacebookWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging?: FacebookMessagingEvent[];
    changes?: Array<{
      value: {
        messaging?: FacebookMessagingEvent[];
      };
      field: string;
    }>;
  }>;
}

export function parseFacebookReferral(event: FacebookMessagingEvent): FacebookReferral | null {
  return event.referral ?? event.postback?.referral ?? null;
}

export async function getFacebookPageName(pageAccessToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=name&access_token=${pageAccessToken}`
    );
    if (!res.ok) return null;
    const data = await res.json() as { name: string };
    return data.name;
  } catch {
    return null;
  }
}

export function buildFacebookOAuthUrl(
  appId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "pages_manage_metadata,pages_messaging,pages_show_list",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}
