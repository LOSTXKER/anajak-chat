import { NextResponse } from "next/server";
import { searchParams } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { upsertContactAndConversation } from "@/lib/webhooks/upsert-contact-conversation";
import type { InstagramWebhookBody } from "@/lib/integrations/instagram";

export async function GET(request: Request) {
  const sp = searchParams(request);
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_ig_verify";

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  let body: InstagramWebhookBody;
  try {
    body = JSON.parse(rawBody) as InstagramWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.object !== "instagram") {
    return NextResponse.json({ ok: true });
  }

  for (const entry of body.entry) {
    const igAccountId = entry.id;

    const channels = await prisma.channel.findMany({
      where: {
        platform: "instagram",
        isActive: true,
      },
    });

    const channel = channels.find((ch) => {
      const creds = ch.credentials as { igAccountId?: string };
      return creds.igAccountId === igAccountId;
    });

    if (!channel) continue;

    const messagingEvents = entry.messaging ?? [];
    for (const event of messagingEvents) {
      if (!event.message) continue;

      const senderId = event.sender.id;
      if (senderId === igAccountId) continue;

      const msg = event.message;
      let contentType: "text" | "image" | "file" = "text";
      let content: string | undefined;
      let mediaUrl: string | undefined;

      if (msg.text) {
        contentType = "text";
        content = msg.text;
      } else if (msg.attachments?.[0]) {
        const att = msg.attachments[0];
        if (att.type === "image") {
          contentType = "image";
          mediaUrl = att.payload.url;
        } else {
          contentType = "file";
          mediaUrl = att.payload.url;
        }
      } else {
        continue;
      }

      await upsertContactAndConversation({
        orgId: channel.orgId,
        channelId: channel.id,
        platform: "instagram",
        platformUserId: senderId,
        platformMessageId: msg.mid,
        content,
        contentType,
        mediaUrl,
        metadata: { igsid: senderId },
        adSource: { igsid: senderId },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
