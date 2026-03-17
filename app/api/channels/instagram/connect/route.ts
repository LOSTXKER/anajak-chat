import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstagramAccountName } from "@/lib/integrations/instagram";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "Facebook App ID not configured" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;
  const redirectUri = `${baseUrl}/api/channels/instagram/callback`;
  const state = Buffer.from(JSON.stringify({ orgId: user.orgId, userId: user.id })).toString("base64url");

  const { buildInstagramOAuthUrl } = await import("@/lib/integrations/instagram");
  const oauthUrl = buildInstagramOAuthUrl(appId, redirectUri, state);

  return NextResponse.json({ url: oauthUrl });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { igAccountId } = await request.json() as { igAccountId: string };

  if (!igAccountId?.trim()) {
    return NextResponse.json({ error: "IG Business Account ID is required" }, { status: 400 });
  }

  const fbChannel = await prisma.channel.findFirst({
    where: { orgId: user.orgId, platform: "facebook", isActive: true },
  });

  if (!fbChannel) {
    return NextResponse.json(
      { error: "กรุณาเชื่อมต่อ Facebook Page ก่อน เพื่อใช้ Page Access Token" },
      { status: 400 }
    );
  }

  const creds = fbChannel.credentials as { pageId: string; pageAccessToken: string };
  const appSecret = process.env.FACEBOOK_APP_SECRET!;

  const igUsername = await getInstagramAccountName(creds.pageAccessToken, igAccountId.trim());
  const displayName = igUsername ? `@${igUsername}` : `IG ${igAccountId.trim()}`;

  const existing = await prisma.channel.findFirst({
    where: { orgId: user.orgId, platform: "instagram" },
  });

  if (existing) {
    await prisma.channel.update({
      where: { id: existing.id },
      data: {
        name: displayName,
        credentials: {
          pageId: creds.pageId,
          igAccountId: igAccountId.trim(),
          pageAccessToken: creds.pageAccessToken,
          appSecret,
          verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_fb_verify",
        },
        isActive: true,
      },
    });
  } else {
    await prisma.channel.create({
      data: {
        orgId: user.orgId,
        platform: "instagram",
        name: displayName,
        credentials: {
          pageId: creds.pageId,
          igAccountId: igAccountId.trim(),
          pageAccessToken: creds.pageAccessToken,
          appSecret,
          verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_fb_verify",
        },
        isActive: true,
      },
    });
  }

  return NextResponse.json({ success: true, name: displayName });
}
