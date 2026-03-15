import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildInstagramOAuthUrl } from "@/lib/integrations/instagram";

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

  const oauthUrl = buildInstagramOAuthUrl(appId, redirectUri, state);

  return NextResponse.json({ url: oauthUrl });
}
