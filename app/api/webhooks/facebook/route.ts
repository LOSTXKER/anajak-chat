import { NextResponse } from "next/server";
import { searchParams } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { verifyFacebookWebhook, parseFacebookReferral } from "@/lib/integrations/facebook";
import { upsertContactAndConversation } from "@/lib/webhooks/upsert-contact-conversation";
import type { FacebookWebhookBody } from "@/lib/integrations/facebook";

export async function GET(request: Request) {
  const sp = searchParams(request);
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "anajak_fb_verify";

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";

  let body: FacebookWebhookBody;
  try {
    body = JSON.parse(rawBody) as FacebookWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.object !== "page") {
    return NextResponse.json({ ok: true });
  }

  for (const entry of body.entry) {
    const pageId = entry.id;

    // Find the Facebook channel for this page
    const channel = await prisma.channel.findFirst({
      where: {
        platform: "facebook",
        isActive: true,
      },
    });

    if (!channel) continue;

    const creds = channel.credentials as {
      pageId: string;
      pageAccessToken: string;
      appSecret: string;
    };

    if (creds.pageId !== pageId) continue;

    if (!verifyFacebookWebhook(creds.appSecret, rawBody, signature)) {
      continue;
    }

    const messagingEvents = entry.messaging ?? [];
    for (const event of messagingEvents) {
      if (!event.message) continue;

      const senderId = event.sender.id;
      if (senderId === pageId) continue; // Skip messages sent by the page itself

      const msg = event.message;
      const referral = parseFacebookReferral(event);

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
        platform: "facebook",
        platformUserId: senderId,
        platformMessageId: msg.mid,
        content,
        contentType,
        mediaUrl,
        metadata: { psid: senderId },
        adSource: referral
          ? {
              sourceAdId: referral.ad_id,
              ctwaClid: referral.ctwa_clid,
              psid: senderId,
            }
          : { psid: senderId },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
