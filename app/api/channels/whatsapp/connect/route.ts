import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) {
      return NextResponse.json({ error: "Facebook App ID not configured (required for WhatsApp)" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;
    const redirectUri = `${baseUrl}/api/channels/whatsapp/callback`;
    const state = Buffer.from(JSON.stringify({ orgId: user.orgId, userId: user.id })).toString("base64url");

    // Meta Embedded Signup for WhatsApp Business
    const oauthUrl = [
      "https://www.facebook.com/dialog/oauth",
      `?client_id=${appId}`,
      `&redirect_uri=${encodeURIComponent(redirectUri)}`,
      `&state=${state}`,
      `&scope=whatsapp_business_management,whatsapp_business_messaging`,
      `&response_type=code`,
    ].join("");

    return NextResponse.json({ url: oauthUrl });
  } catch (err) {
    console.error("[channels/whatsapp/connect]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
