import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const channel = await prisma.channel.findFirst({
    where: { platform: "facebook", isActive: true },
  });

  if (!channel) {
    return NextResponse.json({ error: "No active Facebook channel found" });
  }

  const creds = channel.credentials as {
    pageId: string;
    pageAccessToken: string;
  };

  // Try subscribing the page to the app
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${creds.pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${creds.pageAccessToken}`,
    { method: "POST" }
  );

  const data = await res.json();

  // Also check current subscriptions
  const subsRes = await fetch(
    `https://graph.facebook.com/v21.0/${creds.pageId}/subscribed_apps?access_token=${creds.pageAccessToken}`
  );
  const subsData = await subsRes.json();

  return NextResponse.json({
    channelId: channel.id,
    pageId: creds.pageId,
    subscribeResult: data,
    currentSubscriptions: subsData,
  });
}
