import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyWhatsAppWebhook,
  parseWhatsAppWebhook,
  type WhatsAppCredentials,
  type WhatsAppWebhookBody,
} from "@/lib/integrations/whatsapp";
import { upsertContactAndConversation } from "@/lib/webhooks/upsert-contact-conversation";

// GET — webhook verification
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  // Find any WhatsApp channel and verify
  const channels = await prisma.channel.findMany({
    where: { platform: "whatsapp", isActive: true },
    select: { credentials: true },
  });

  for (const ch of channels) {
    const creds = ch.credentials as unknown as WhatsAppCredentials;
    const result = verifyWhatsAppWebhook(mode, token, challenge, creds.verifyToken);
    if (result) return new Response(result, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// POST — receive messages
export async function POST(request: NextRequest) {
  let body: WhatsAppWebhookBody;
  try {
    body = await request.json() as WhatsAppWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.object !== "whatsapp_business_account") {
    return NextResponse.json({ ok: true });
  }

  const messages = parseWhatsAppWebhook(body);

  for (const msg of messages) {
    // Find the channel by phone_number_id stored in credentials
    const channel = await prisma.channel.findFirst({
      where: {
        platform: "whatsapp",
        isActive: true,
      },
      select: { id: true, orgId: true, credentials: true },
    });

    if (!channel) continue;
    const creds = channel.credentials as unknown as WhatsAppCredentials;

    await upsertContactAndConversation({
      orgId: channel.orgId,
      channelId: channel.id,
      platform: "whatsapp",
      platformUserId: msg.from,
      displayName: msg.displayName,
      platformMessageId: msg.messageId,
      content: msg.text ?? undefined,
      contentType: msg.type === "image" ? "image" : "text",
      mediaUrl: msg.imageUrl ?? undefined,
      adSource: msg.referral
        ? {
            sourceAdId: msg.referral.source_id,
            sourcePlacement: msg.referral.source_type,
            ctwaClid: msg.referral.ctwa_clid,
          }
        : undefined,
    });
  }

  return NextResponse.json({ ok: true });
}
