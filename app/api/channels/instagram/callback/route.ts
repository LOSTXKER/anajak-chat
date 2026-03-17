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

  // DEBUG: return all info as JSON instead of redirecting
  const debug: Record<string, unknown> = { step: "start", code: !!code, state: !!state, error };

  if (error || !code || !state) {
    return NextResponse.json({ ...debug, result: "oauth_failed" });
  }

  let stateData: { orgId: string; userId: string };
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    debug.stateData = stateData;
  } catch (e) {
    return NextResponse.json({ ...debug, result: "invalid_state", detail: String(e) });
  }

  const igAppId = process.env.INSTAGRAM_APP_ID;
  const igAppSecret = process.env.INSTAGRAM_APP_SECRET;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  debug.hasIgAppId = !!igAppId;
  debug.hasIgAppSecret = !!igAppSecret;
  debug.hasAppSecret = !!appSecret;

  if (!igAppId || !igAppSecret) {
    return NextResponse.json({ ...debug, result: "missing_env_vars" });
  }

  const redirectUri = `${baseUrl}/api/channels/instagram/callback`;
  debug.redirectUri = redirectUri;

  const tokenResult = await exchangeInstagramCode(igAppId, igAppSecret, redirectUri, code);
  if (!tokenResult || tokenResult.error) {
    return NextResponse.json({ ...debug, result: "token_exchange_failed", igError: tokenResult?.error ?? "null response" });
  }
  debug.tokenUserId = tokenResult.userId;

  const longLivedToken = await exchangeForLongLivedToken(igAppSecret, tokenResult.accessToken);
  debug.hasLongLivedToken = !!longLivedToken;
  const finalToken = longLivedToken ?? tokenResult.accessToken;

  const userInfo = await getInstagramUserInfo(finalToken);
  if (!userInfo) {
    return NextResponse.json({ ...debug, result: "user_info_failed" });
  }
  debug.userInfo = userInfo;

  const displayName = `@${userInfo.username}`;
  const igAccountId = userInfo.id;

  const fbChannel = await prisma.channel.findFirst({
    where: { orgId: stateData.orgId, platform: "facebook", isActive: true },
  });
  const fbCreds = fbChannel?.credentials as { pageId?: string; pageAccessToken?: string } | null;
  debug.hasFbChannel = !!fbChannel;

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
      appSecret: appSecret!,
      verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_fb_verify",
    },
    isActive: true,
  };

  try {
    if (existing) {
      await prisma.channel.update({ where: { id: existing.id }, data: channelData });
    } else {
      await prisma.channel.create({
        data: { orgId: stateData.orgId, platform: "instagram", ...channelData },
      });
    }
    return NextResponse.json({ ...debug, result: "SUCCESS", displayName });
  } catch (e) {
    return NextResponse.json({ ...debug, result: "db_error", detail: String(e) });
  }
}
