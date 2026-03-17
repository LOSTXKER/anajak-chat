import { sendFacebookMessage, verifyFacebookWebhook } from "./facebook";
import type { FacebookCredentials, FacebookAttachment, FacebookReferral } from "./facebook";

export type InstagramCredentials = {
  igAccessToken?: string;
  igAccountId?: string;
  pageAccessToken?: string;
  pageId?: string;
  appSecret: string;
  verifyToken: string;
};

export async function sendInstagramMessage(
  credentials: InstagramCredentials,
  recipientIgsid: string,
  message: { text?: string; attachment?: FacebookAttachment }
): Promise<boolean> {
  // Prefer Instagram Graph API with IG token
  if (credentials.igAccessToken && credentials.igAccountId) {
    const body: Record<string, unknown> = {
      recipient: { id: recipientIgsid },
      message,
    };
    const res = await fetch(
      `https://graph.instagram.com/v21.0/${credentials.igAccountId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.igAccessToken}`,
        },
        body: JSON.stringify(body),
      }
    );
    return res.ok;
  }

  // Fallback to Messenger Platform with Page Access Token
  if (credentials.pageAccessToken) {
    const fbCreds: FacebookCredentials = {
      pageId: credentials.pageId ?? "",
      pageAccessToken: credentials.pageAccessToken,
      appSecret: credentials.appSecret,
      verifyToken: credentials.verifyToken,
    };
    return sendFacebookMessage(fbCreds, recipientIgsid, message);
  }

  return false;
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
  igAppId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: igAppId,
    redirect_uri: redirectUri,
    scope: "instagram_business_basic,instagram_business_manage_messages",
    response_type: "code",
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeInstagramCode(
  igAppId: string,
  igAppSecret: string,
  redirectUri: string,
  code: string
): Promise<{ accessToken: string; userId: string; error?: string } | null> {
  const res = await fetch("https://graph.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: igAppId,
      client_secret: igAppSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    return { accessToken: "", userId: "", error: `${res.status}: ${errText}` };
  }
  const data = await res.json() as { access_token: string; user_id: number };
  return { accessToken: data.access_token, userId: String(data.user_id) };
}

export async function exchangeForLongLivedToken(
  igAppSecret: string,
  shortLivedToken: string
): Promise<string | null> {
  const res = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${igAppSecret}&access_token=${shortLivedToken}`
  );
  if (!res.ok) return null;
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function getInstagramUserInfo(
  accessToken: string
): Promise<{ id: string; username: string } | null> {
  const res = await fetch(
    `https://graph.instagram.com/v21.0/me?fields=user_id,username&access_token=${accessToken}`
  );
  if (!res.ok) {
    const errText = await res.text();
    console.error("[IG] User info failed:", res.status, errText);
    return null;
  }
  const data = await res.json() as { user_id: string; username: string };
  return { id: data.user_id, username: data.username };
}
