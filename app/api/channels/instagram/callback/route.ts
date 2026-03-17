import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInstagramAccountName } from "@/lib/integrations/instagram";

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

  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = `${baseUrl}/api/channels/instagram/callback`;

  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  );

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=token_exchange_failed`);
  }

  const tokenData = await tokenRes.json() as { access_token: string };
  const userAccessToken = tokenData.access_token;

  // Get pages list first
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`
  );

  if (!pagesRes.ok) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=pages_fetch_failed`);
  }

  const pagesData = await pagesRes.json() as {
    data: Array<{
      id: string;
      name: string;
      access_token: string;
    }>;
  };

  if (!pagesData.data?.length) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=no_pages`);
  }

  // Use Page Access Token to query instagram_business_account (doesn't need IG OAuth scope)
  let pageWithIg: { id: string; name: string; access_token: string } | undefined;
  let igAccountId: string | undefined;

  for (const page of pagesData.data) {
    const igRes = await fetch(
      `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );
    if (igRes.ok) {
      const igData = await igRes.json() as { instagram_business_account?: { id: string } };
      if (igData.instagram_business_account) {
        pageWithIg = page;
        igAccountId = igData.instagram_business_account.id;
        break;
      }
    }
  }

  if (!pageWithIg || !igAccountId) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=no_instagram_account`);
  }

  const igUsername = await getInstagramAccountName(pageWithIg.access_token, igAccountId) ?? `@instagram`;

  const existing = await prisma.channel.findFirst({
    where: { orgId: stateData.orgId, platform: "instagram" },
  });

  if (existing) {
    await prisma.channel.update({
      where: { id: existing.id },
      data: {
        name: igUsername,
        credentials: {
          pageId: pageWithIg.id,
          igAccountId,
          pageAccessToken: pageWithIg.access_token,
          appSecret,
          verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_ig_verify",
        },
        isActive: true,
      },
    });
  } else {
    await prisma.channel.create({
      data: {
        orgId: stateData.orgId,
        platform: "instagram",
        name: igUsername,
        credentials: {
          pageId: pageWithIg.id,
          igAccountId,
          pageAccessToken: pageWithIg.access_token,
          appSecret,
          verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_ig_verify",
        },
        isActive: true,
      },
    });
  }

  return NextResponse.redirect(`${baseUrl}/settings/channels?success=instagram_connected`);
}
