import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFacebookPageName } from "@/lib/integrations/facebook";

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
  const redirectUri = `${baseUrl}/api/channels/facebook/callback`;

  // Exchange code for user access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  );

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=token_exchange_failed`);
  }

  const tokenData = await tokenRes.json() as { access_token: string };
  const userAccessToken = tokenData.access_token;

  // Get list of pages the user manages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`
  );

  if (!pagesRes.ok) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=pages_fetch_failed`);
  }

  const pagesData = await pagesRes.json() as {
    data: Array<{ id: string; name: string; access_token: string }>;
  };

  if (!pagesData.data || pagesData.data.length === 0) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=no_pages`);
  }

  // Use first page (in production, allow user to select)
  const page = pagesData.data[0];

  const pageName = await getFacebookPageName(page.access_token) ?? page.name;

  // Subscribe the page to the app's webhooks so Facebook sends events
  const subscribeRes = await fetch(
    `https://graph.facebook.com/v21.0/${page.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${page.access_token}`,
    { method: "POST" }
  );

  if (!subscribeRes.ok) {
    console.error("[FB Callback] Failed to subscribe page to app:", await subscribeRes.text());
  }

  await prisma.channel.upsert({
    where: {
      // Use a deterministic lookup - find by platform + credentials
      id: "00000000-0000-0000-0000-000000000000", // placeholder - won't match
    },
    create: {
      orgId: stateData.orgId,
      platform: "facebook",
      name: pageName,
      credentials: {
        pageId: page.id,
        pageAccessToken: page.access_token,
        appSecret,
        verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_fb_verify",
      },
      isActive: true,
    },
    update: {
      name: pageName,
      credentials: {
        pageId: page.id,
        pageAccessToken: page.access_token,
        appSecret,
        verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_fb_verify",
      },
      isActive: true,
    },
  }).catch(async () => {
    // If upsert fails, just create
    const existing = await prisma.channel.findFirst({
      where: { orgId: stateData.orgId, platform: "facebook" },
    });
    if (existing) {
      await prisma.channel.update({
        where: { id: existing.id },
        data: {
          name: pageName,
          credentials: {
            pageId: page.id,
            pageAccessToken: page.access_token,
            appSecret,
            verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_fb_verify",
          },
          isActive: true,
        },
      });
    } else {
      await prisma.channel.create({
        data: {
          orgId: stateData.orgId,
          platform: "facebook",
          name: pageName,
          credentials: {
            pageId: page.id,
            pageAccessToken: page.access_token,
            appSecret,
            verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_fb_verify",
          },
          isActive: true,
        },
      });
    }
  });

  return NextResponse.redirect(`${baseUrl}/settings/channels?success=facebook_connected`);
}
