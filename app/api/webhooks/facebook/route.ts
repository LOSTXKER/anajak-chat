import { NextResponse } from "next/server";

export const maxDuration = 30;
import { searchParams } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { verifyFacebookWebhook, parseFacebookReferral } from "@/lib/integrations/facebook";
import { upsertContactAndConversation } from "@/lib/webhooks/upsert-contact-conversation";
import { matchIntents, executeIntent } from "@/lib/flow-engine";
import type { FacebookWebhookBody } from "@/lib/integrations/facebook";

export async function GET(request: Request) {
  const sp = searchParams(request);
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

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

    const channel = await prisma.channel.findFirst({
      where: {
        platform: "facebook",
        isActive: true,
        credentials: { path: ["pageId"], equals: pageId },
      },
    });

    if (!channel) continue;

    const creds = channel.credentials as {
      pageId: string;
      pageAccessToken: string;
      appSecret: string;
    };

    if (!verifyFacebookWebhook(creds.appSecret, rawBody, signature)) {
      continue;
    }

    const messagingEvents = entry.messaging ?? [];
    for (const event of messagingEvents) {
      // Handle postback events (button taps)
      if (event.postback && !event.message) {
        const senderId = event.sender.id;
        const contact = await prisma.contact.findFirst({
          where: { platformId: senderId, platform: "facebook", orgId: channel.orgId },
        });
        if (contact) {
          const conversation = await prisma.conversation.findFirst({
            where: { contactId: contact.id, orgId: channel.orgId },
            orderBy: { createdAt: "desc" },
          });
          if (conversation) {
            const postbackContent = event.postback.payload ?? event.postback.title ?? "";
            const match = await matchIntents({
              orgId: channel.orgId,
              messageContent: postbackContent,
              eventType: "postback",
              postbackData: event.postback.payload,
            }).catch(() => null);

            if (match) {
              await executeIntent({
                match,
                platform: "facebook",
                credentials: channel.credentials,
                recipientId: senderId,
                conversationId: conversation.id,
              }).catch((e) => console.error("[FB Webhook] intent execute error:", e));
            }
          }
        }
        continue;
      }

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
