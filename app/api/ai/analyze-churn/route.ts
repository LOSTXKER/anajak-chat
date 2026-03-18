import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { analyzeChurn } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  if (!checkRateLimit(`ai-churn:${user.id}`, 10, 60_000)) {
    return jsonError("Rate limit exceeded. Try again in a minute.", 429);
  }
  const { conversationId, contactId } = (await req.json()) as {
    conversationId?: string;
    contactId?: string;
  };

  if (!conversationId && !contactId) {
    return jsonError("conversationId or contactId required", 400);
  }

  let conversations;

  if (conversationId) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, orgId: user.orgId },
      include: {
        contact: { select: { displayName: true, segment: true, totalOrders: true, platform: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 30,
          where: { content: { not: null } },
          select: { content: true, senderType: true },
        },
      },
    });
    if (!conv) return jsonError("Conversation not found", 404);
    conversations = [conv];
  } else {
    conversations = await prisma.conversation.findMany({
      where: { contactId, orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        contact: { select: { displayName: true, segment: true, totalOrders: true, platform: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 30,
          where: { content: { not: null } },
          select: { content: true, senderType: true },
        },
      },
    });
    if (conversations.length === 0) return jsonError("No conversations found", 404);
  }

  const allMessages = conversations.flatMap((c) =>
    c.messages.map((m) => ({
      role: m.senderType === "contact" ? ("user" as const) : ("assistant" as const),
      content: m.content!,
    }))
  );

  const contact = conversations[0].contact;
  const result = await analyzeChurn(allMessages, {
    name: contact.displayName,
    segment: contact.segment,
    totalOrders: contact.totalOrders,
    platform: contact.platform,
  });

  if (conversationId) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { dropOffReason: result.reason },
    });
  }

  return NextResponse.json(result);
});
