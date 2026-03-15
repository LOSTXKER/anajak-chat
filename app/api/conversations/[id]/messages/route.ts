import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPlatformMessage } from "@/lib/integrations/send-message";
import { requireAuth, searchParams, jsonError, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler(async (request, context) => {
  const user = await requireAuth();
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const sp = searchParams(request);
  const cursor = sp.get("cursor");
  const limit = parseInt(sp.get("limit") ?? "50");

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!conversation) return jsonError("Not found", 404);

  const messages = await prisma.message.findMany({
    where: {
      conversationId: id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      // Include sender info for agent messages via senderId
    },
  });

  const reversed = messages.reverse();
  const nextCursor = messages.length === limit ? messages[0].createdAt.toISOString() : null;

  return NextResponse.json({ messages: reversed, nextCursor });
});

export const POST = apiHandler(async (request, context) => {
  const user = await requireAuth();
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const body = await request.json();
  const { content, contentType = "text", mediaUrl, mediaFileId } = body;

  if (!content && !mediaUrl) {
    return jsonError("content or mediaUrl required", 400);
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
    include: { channel: true, contact: true },
  });
  if (!conversation) return jsonError("Not found", 404);

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderType: "agent",
      senderId: user.id,
      content,
      contentType,
      mediaUrl,
      metadata: mediaFileId ? { mediaFileId } : {},
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: {
      lastMessageAt: new Date(),
      ...(!conversation.firstResponseAt && { firstResponseAt: new Date() }),
    },
  });

  try {
    await sendPlatformMessage({
      platform: conversation.channel.platform,
      credentials: conversation.channel.credentials,
      recipientId: conversation.contact.platformId,
      text: content ?? "",
      imageUrl: contentType === "image" && mediaUrl ? mediaUrl : undefined,
    });
  } catch {
    // Platform send failed - message is still saved in DB
  }

  return NextResponse.json(message);
});
