import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { sendPlatformMessage } from "@/lib/integrations/send-message";

export const POST = apiHandler(async (request, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await request.json() as { content: string };
  if (!body.content) return jsonError("content required", 400);

  const log = await prisma.aiReplyLog.findFirst({
    where: { id, orgId: user.orgId, status: "pending_review" },
    include: {
      conversation: {
        include: {
          contact: { select: { platformId: true } },
          channel: { select: { platform: true, credentials: true } },
        },
      },
    },
  });
  if (!log) return jsonError("Not found or not pending", 404);

  const content = body.content;

  try {
    await sendPlatformMessage({
      platform: log.conversation.channel.platform,
      credentials: log.conversation.channel.credentials,
      recipientId: log.conversation.contact.platformId,
      text: content,
    });

    const msg = await prisma.message.create({
      data: {
        conversationId: log.conversationId,
        senderType: "agent",
        senderId: user.id,
        content,
        contentType: "text",
        platformMessageId: `ai-edited-${id}`,
        metadata: { aiLogId: id, editedBy: user.id },
      },
    });

    await prisma.aiReplyLog.update({
      where: { id },
      data: { status: "edited", reviewedBy: user.id, reviewedAt: new Date(), messageId: msg.id, finalContent: content },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(String(err), 500);
  }
});
