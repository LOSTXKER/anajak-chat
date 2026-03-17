import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildFacebookOAuthUrl } from "@/lib/integrations/facebook";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) {
      return NextResponse.json({ error: "Facebook App ID not configured" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;
    const redirectUri = `${baseUrl}/api/channels/facebook/callback`;
    const state = Buffer.from(JSON.stringify({ orgId: user.orgId, userId: user.id })).toString("base64url");

    const oauthUrl = buildFacebookOAuthUrl(appId, redirectUri, state);

    return NextResponse.json({ url: oauthUrl });
  } catch (err) {
    console.error("[channels/facebook/connect]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
