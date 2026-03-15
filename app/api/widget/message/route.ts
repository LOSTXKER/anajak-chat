import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    orgId: string;
    sessionId: string;
    visitorName?: string;
    content: string;
  };

  if (!body.orgId || !body.sessionId || !body.content) {
    return NextResponse.json({ error: "orgId, sessionId, content required" }, { status: 400 });
  }

  // Find or create the web channel for this org
  let channel = await prisma.channel.findFirst({
    where: { orgId: body.orgId, platform: "web", isActive: true },
  });

  if (!channel) {
    channel = await prisma.channel.create({
      data: {
        orgId: body.orgId,
        name: "Website Live Chat",
        platform: "web",
        credentials: {},
        isActive: true,
      },
    });
  }

  // Upsert contact using sessionId as platformId
  let contact = await prisma.contact.findFirst({
    where: { orgId: body.orgId, platformId: body.sessionId, platform: "web" },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        orgId: body.orgId,
        platformId: body.sessionId,
        platform: "web",
        displayName: body.visitorName ?? `Visitor ${body.sessionId.slice(0, 8)}`,
      },
    });
    await prisma.contact.update({
      where: { id: contact.id },
      data: { totalConversations: { increment: 1 } },
    });
  }

  // Find or create open conversation
  let conversation = await prisma.conversation.findFirst({
    where: { orgId: body.orgId, contactId: contact.id, status: { in: ["open", "pending"] } },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        orgId: body.orgId,
        channelId: channel.id,
        contactId: contact.id,
        status: "open",
        lastMessageAt: new Date(),
      },
    });
  }

  // Save message
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderType: "contact",
      content: body.content,
      contentType: "text",
      platformMessageId: `web-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({
    conversationId: conversation.id,
    messageId: message.id,
    contactId: contact.id,
  });
}
