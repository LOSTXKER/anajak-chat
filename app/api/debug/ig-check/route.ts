import { NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  await requireAuth();

  const fbChannel = await prisma.channel.findFirst({
    where: { platform: "facebook", isActive: true },
  });

  if (!fbChannel) {
    return NextResponse.json({ error: "No Facebook channel found" });
  }

  const creds = fbChannel.credentials as { pageId: string; pageAccessToken: string };

  const igRes = await fetch(
    `https://graph.facebook.com/v21.0/${creds.pageId}?fields=instagram_business_account,name&access_token=${creds.pageAccessToken}`
  );

  const igData = await igRes.json();

  return NextResponse.json({
    pageId: creds.pageId,
    pageName: fbChannel.name,
    graphApiResponse: igData,
    hasIgAccount: !!igData?.instagram_business_account,
  });
});
