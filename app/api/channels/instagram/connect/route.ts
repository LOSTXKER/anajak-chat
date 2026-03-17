import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildInstagramOAuthUrl } from "@/lib/integrations/instagram";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const igAppId = process.env.INSTAGRAM_APP_ID;
    if (!igAppId) {
      return NextResponse.json({ error: "Instagram App ID not configured" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;
    const redirectUri = `${baseUrl}/api/channels/instagram/callback`;
    const state = Buffer.from(JSON.stringify({ orgId: user.orgId, userId: user.id })).toString("base64url");

    const oauthUrl = buildInstagramOAuthUrl(igAppId, redirectUri, state);

    return NextResponse.json({ url: oauthUrl });
  } catch (err) {
    console.error("[channels/instagram/connect]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
