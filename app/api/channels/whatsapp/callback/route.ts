import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { META_GRAPH_BASE_URL } from "@/lib/constants";

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
  const redirectUri = `${baseUrl}/api/channels/whatsapp/callback`;

  // Exchange code for user access token
  const tokenRes = await fetch(
    `${META_GRAPH_BASE_URL}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  );

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=token_exchange_failed`);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };
  const userAccessToken = tokenData.access_token;

  // Get WhatsApp Business Accounts the user manages
  const wabaRes = await fetch(
    `${META_GRAPH_BASE_URL}/me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name}&access_token=${userAccessToken}`
  );

  if (!wabaRes.ok) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=waba_fetch_failed`);
  }

  const wabaData = (await wabaRes.json()) as {
    data: Array<{
      id: string;
      name: string;
      owned_whatsapp_business_accounts?: { data: Array<{ id: string; name: string }> };
    }>;
  };

  // Find the first WABA
  let wabaId: string | null = null;
  let wabaName = "WhatsApp";
  for (const biz of wabaData.data ?? []) {
    const accounts = biz.owned_whatsapp_business_accounts?.data;
    if (accounts && accounts.length > 0) {
      wabaId = accounts[0].id;
      wabaName = accounts[0].name || biz.name;
      break;
    }
  }

  if (!wabaId) {
    return NextResponse.redirect(`${baseUrl}/settings/channels?error=no_waba`);
  }

  // Get phone numbers for this WABA
  const phonesRes = await fetch(
    `${META_GRAPH_BASE_URL}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name&access_token=${userAccessToken}`
  );

  let phoneNumberId: string | null = null;
  let displayPhone = "";
  if (phonesRes.ok) {
    const phonesData = (await phonesRes.json()) as {
      data: Array<{ id: string; display_phone_number: string; verified_name: string }>;
    };
    if (phonesData.data.length > 0) {
      phoneNumberId = phonesData.data[0].id;
      displayPhone = phonesData.data[0].display_phone_number;
      wabaName = phonesData.data[0].verified_name || wabaName;
    }
  }

  const existing = await prisma.channel.findFirst({
    where: { orgId: stateData.orgId, platform: "whatsapp" },
  });

  const channelData = {
    platform: "whatsapp" as const,
    name: displayPhone ? `WhatsApp ${displayPhone}` : wabaName,
    credentials: {
      wabaId,
      phoneNumberId,
      accessToken: userAccessToken,
      displayPhone,
    },
    isActive: true,
  };

  if (existing) {
    await prisma.channel.update({
      where: { id: existing.id },
      data: channelData,
    });
  } else {
    await prisma.channel.create({
      data: { orgId: stateData.orgId, ...channelData },
    });
  }

  return NextResponse.redirect(`${baseUrl}/settings/channels?success=whatsapp_connected`);
}
