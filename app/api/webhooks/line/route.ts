import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLineSignature } from "@/lib/integrations/line";
import { upsertContactAndConversation } from "@/lib/webhooks/upsert-contact-conversation";
import type { LineWebhookBody } from "@/lib/integrations/line";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  // Find the LINE channel by destination (sent in body)
  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody) as LineWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Find channel by destination (LINE bot ID)
  const channel = await prisma.channel.findFirst({
    where: {
      platform: "line",
      isActive: true,
    },
  });

  if (!channel) {
    return NextResponse.json({ ok: true }); // Acknowledge even if no channel found
  }

  const creds = channel.credentials as {
    channelSecret: string;
    channelAccessToken: string;
  };

  if (!verifyLineSignature(creds.channelSecret, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  for (const event of body.events) {
    if (event.type !== "message") continue;
    if (!event.source.userId) continue;
    if (!event.message) continue;

    const msg = event.message;
    let contentType: "text" | "image" | "file" | "sticker" = "text";
    let content: string | undefined;
    let mediaUrl: string | undefined;

    if (msg.type === "text" && msg.text) {
      contentType = "text";
      content = msg.text;
    } else if (msg.type === "image") {
      contentType = "image";
      mediaUrl = msg.contentProvider?.originalContentUrl;
    } else if (msg.type === "sticker") {
      contentType = "sticker";
      content = "[Sticker]";
    } else if (["file", "video", "audio"].includes(msg.type)) {
      contentType = "file";
      mediaUrl = msg.contentProvider?.originalContentUrl;
    } else {
      continue;
    }

    await upsertContactAndConversation({
      orgId: channel.orgId,
      channelId: channel.id,
      platform: "line",
      platformUserId: event.source.userId,
      platformMessageId: msg.id,
      content,
      contentType,
      mediaUrl,
      metadata: { lineEventType: event.type, replyToken: event.replyToken },
    });
  }

  return NextResponse.json({ ok: true });
}
