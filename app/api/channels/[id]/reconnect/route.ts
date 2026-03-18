import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { buildFacebookOAuthUrl } from "@/lib/integrations/facebook";

export const POST = apiHandler(async (req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const channel = await prisma.channel.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!channel) return jsonError("Channel not found", 404);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  const appId = process.env.FACEBOOK_APP_ID;

  switch (channel.platform) {
    case "facebook": {
      if (!appId) return jsonError("Facebook App ID not configured", 500);
      const redirectUri = `${baseUrl}/api/channels/facebook/callback`;
      const state = Buffer.from(JSON.stringify({ orgId: user.orgId, userId: user.id })).toString("base64url");
      const url = buildFacebookOAuthUrl(appId, redirectUri, state);
      return NextResponse.json({ url });
    }
    case "instagram": {
      const igAppId = process.env.INSTAGRAM_APP_ID ?? appId;
      if (!igAppId) return jsonError("Instagram App ID not configured", 500);
      const redirectUri = `${baseUrl}/api/channels/instagram/callback`;
      const state = Buffer.from(JSON.stringify({ orgId: user.orgId, userId: user.id })).toString("base64url");
      const url = [
        "https://www.facebook.com/dialog/oauth",
        `?client_id=${igAppId}`,
        `&redirect_uri=${encodeURIComponent(redirectUri)}`,
        `&state=${state}`,
        `&scope=instagram_basic,instagram_manage_messages,pages_show_list`,
        `&response_type=code`,
      ].join("");
      return NextResponse.json({ url });
    }
    case "whatsapp": {
      if (!appId) return jsonError("Facebook App ID not configured", 500);
      const redirectUri = `${baseUrl}/api/channels/whatsapp/callback`;
      const state = Buffer.from(JSON.stringify({ orgId: user.orgId, userId: user.id })).toString("base64url");
      const url = [
        "https://www.facebook.com/dialog/oauth",
        `?client_id=${appId}`,
        `&redirect_uri=${encodeURIComponent(redirectUri)}`,
        `&state=${state}`,
        `&scope=whatsapp_business_management,whatsapp_business_messaging`,
        `&response_type=code`,
      ].join("");
      return NextResponse.json({ url });
    }
    case "line":
      return jsonError("LINE ไม่รองรับ reconnect อัตโนมัติ กรุณายกเลิกการเชื่อมต่อแล้วเชื่อมต่อใหม่", 400);
    default:
      return jsonError(`Unsupported platform: ${channel.platform}`, 400);
  }
});
