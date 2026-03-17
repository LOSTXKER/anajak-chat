import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeInstagramCode,
  exchangeForLongLivedToken,
  getInstagramUserInfo,
} from "@/lib/integrations/instagram";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? url.origin;

  if (error || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=oauth_failed`);
  }

  let stateData: { orgId: string; userId: string };
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=invalid_state`);
  }

  const igAppId = process.env.INSTAGRAM_APP_ID!;
  const igAppSecret = process.env.INSTAGRAM_APP_SECRET!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = `${baseUrl}/api/channels/instagram/callback`;

  const tokenResult = await exchangeInstagramCode(igAppId, igAppSecret, redirectUri, code);
  if (!tokenResult) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=token_exchange_failed`);
  }

  const longLivedToken = await exchangeForLongLivedToken(igAppSecret, tokenResult.accessToken);
  const finalToken = longLivedToken ?? tokenResult.accessToken;

  const userInfo = await getInstagramUserInfo(finalToken);
  if (!userInfo) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=no_instagram_account`);
  }

  const displayName = `@${userInfo.username}`;
  const igAccountId = userInfo.id;

  // Get Page Access Token from connected Facebook channel (needed for sending messages)
  const fbChannel = await prisma.channel.findFirst({
    where: { orgId: stateData.orgId, platform: "facebook", isActive: true },
  });
  const fbCreds = fbChannel?.credentials as { pageId?: string; pageAccessToken?: string } | null;

  const existing = await prisma.channel.findFirst({
    where: { orgId: stateData.orgId, platform: "instagram" },
  });

  const channelData = {
    name: displayName,
    credentials: {
      igAccountId,
      igAccessToken: finalToken,
      pageId: fbCreds?.pageId ?? null,
      pageAccessToken: fbCreds?.pageAccessToken ?? null,
      appSecret,
      verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_fb_verify",
    },
    isActive: true,
  };

  if (existing) {
    await prisma.channel.update({ where: { id: existing.id }, data: channelData });
  } else {
    await prisma.channel.create({
      data: { orgId: stateData.orgId, platform: "instagram", ...channelData },
    });
  }

  return NextResponse.redirect(`${baseUrl}/settings/channels?success=instagram_connected`);
}
