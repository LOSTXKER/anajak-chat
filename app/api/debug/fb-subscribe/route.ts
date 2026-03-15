import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const channel = await prisma.channel.findFirst({
    where: { platform: "facebook", isActive: true },
  });

  if (!channel) {
    return NextResponse.json({ error: "No active Facebook channel found" });
  }

  const creds = channel.credentials as {
    pageId: string;
    pageAccessToken: string;
    appSecret: string;
  };

  // 1. Check if page access token is valid
  const tokenDebug = await fetch(
    `https://graph.facebook.com/v21.0/debug_token?input_token=${creds.pageAccessToken}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
  ).then(r => r.json());

  // 2. Check page info with the token
  const pageInfo = await fetch(
    `https://graph.facebook.com/v21.0/${creds.pageId}?fields=id,name,access_token&access_token=${creds.pageAccessToken}`
  ).then(r => r.json());

  // 3. Check current page subscriptions
  const subs = await fetch(
    `https://graph.facebook.com/v21.0/${creds.pageId}/subscribed_apps?access_token=${creds.pageAccessToken}`
  ).then(r => r.json());

  // 4. Check app-level webhook subscriptions
  const appSubs = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.FACEBOOK_APP_ID}/subscriptions?access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
  ).then(r => r.json());

  // 5. Re-subscribe page
  const resubscribe = await fetch(
    `https://graph.facebook.com/v21.0/${creds.pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${creds.pageAccessToken}`,
    { method: "POST" }
  ).then(r => r.json());

  return NextResponse.json({
    channelId: channel.id,
    pageId: creds.pageId,
    tokenDebug,
    pageInfo: { id: pageInfo.id, name: pageInfo.name, error: pageInfo.error },
    currentPageSubscriptions: subs,
    appWebhookSubscriptions: appSubs,
    resubscribeResult: resubscribe,
  });
}
