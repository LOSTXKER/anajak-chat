import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLineSignature } from "@/lib/integrations/line";
import type { LineCredentials, LineWebhookBody } from "@/lib/integrations/line";
import { matchIntents, executeIntent } from "@/lib/flow-engine";
import { upsertContactAndConversation } from "@/lib/webhooks/upsert-contact-conversation";

export const maxDuration = 30;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody) as LineWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const channel = await prisma.channel.findFirst({
    where: { platform: "line", isActive: true },
  });

  if (!channel) {
    return NextResponse.json({ ok: true });
  }

  const creds = channel.credentials as LineCredentials & Record<string, string>;

  if (!verifyLineSignature(creds.channelSecret, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Process events: try to send auto-reply FIRST (while replyToken is fresh),
  // then do DB upserts in the background
  for (const event of body.events) {
    if (!event.source.userId) continue;

    const replyToken = event.replyToken;

    if (event.type === "postback" && event.postback) {
      // --- Postback: match intent immediately, then upsert in background ---
      const match = await matchIntents({
        orgId: channel.orgId,
        messageContent: event.postback.data,
        eventType: "postback",
        postbackData: event.postback.data,
      }).catch((e) => { console.error("[LINE] intent match error:", e); return null; });

      if (match) {
        const contact = await prisma.contact.findFirst({
          where: { platformId: event.source.userId, platform: "line", orgId: channel.orgId },
        });
        const conversation = contact
          ? await prisma.conversation.findFirst({
              where: { contactId: contact.id, orgId: channel.orgId },
              orderBy: { createdAt: "desc" },
            })
          : null;

        if (conversation) {
          await executeIntent({
            match,
            platform: "line",
            credentials: creds,
            recipientId: event.source.userId,
            conversationId: conversation.id,
            replyToken,
          }).catch((e) => console.error("[LINE] execute intent error:", e));
        }
      }
      continue;
    }

    if (event.type !== "message" || !event.message) continue;

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

    // STEP 1: Try to match an intent and send reply IMMEDIATELY (replyToken is fresh)
    let intentHandled = false;
    if (content) {
      const match = await matchIntents({
        orgId: channel.orgId,
        messageContent: content,
        eventType: "message",
        channelId: channel.id,
      }).catch((e) => { console.error("[LINE] intent match error:", e); return null; });

      if (match) {
        // Do a quick upsert first so we have a conversationId for the session
        const result = await upsertContactAndConversation({
          orgId: channel.orgId,
          channelId: channel.id,
          platform: "line",
          platformUserId: event.source.userId,
          platformMessageId: msg.id,
          content,
          contentType,
          mediaUrl,
          metadata: { lineEventType: event.type, replyToken },
          skipPostHooks: true,
        }).catch((e) => { console.error("[LINE] upsert error:", e); return null; });

        if (result) {
          await executeIntent({
            match,
            platform: "line",
            credentials: creds,
            recipientId: event.source.userId,
            conversationId: result.conversation.id,
            replyToken,
          }).catch((e) => console.error("[LINE] execute intent error:", e));
          intentHandled = true;

          // Run remaining hooks in background
          const userId = event.source.userId!;
          const convId = result.conversation.id;
          after(async () => {
            const { runPostMessageHooks } = await import("@/lib/webhooks/upsert-contact-conversation");
            await runPostMessageHooks({
              orgId: channel.orgId,
              channelId: channel.id,
              platform: "line",
              platformUserId: userId,
              conversationId: convId,
              content,
              skipFlowEngine: true,
            }).catch((e) => console.error("[LINE] post hooks error:", e));
          });
        }
      }
    }

    // STEP 2: If no intent matched, do the normal full flow
    if (!intentHandled) {
      await upsertContactAndConversation({
        orgId: channel.orgId,
        channelId: channel.id,
        platform: "line",
        platformUserId: event.source.userId,
        platformMessageId: msg.id,
        content,
        contentType,
        mediaUrl,
        metadata: { lineEventType: event.type, replyToken },
      }).catch((e) => console.error("[LINE] upsert error:", e));
    }
  }

  return NextResponse.json({ ok: true });
}
