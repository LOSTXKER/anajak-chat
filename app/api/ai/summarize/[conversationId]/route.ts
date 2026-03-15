import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { summarizeConversation } from "@/lib/gemini";

export const POST = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { conversationId } = await (context as { params: Promise<{ conversationId: string }> }).params;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, orgId: user.orgId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 30,
        select: { content: true, senderType: true },
      },
    },
  });
  if (!conversation) return jsonError("Not found", 404);

  const history = conversation.messages
    .filter((m) => m.content)
    .map((m) => ({
      role: m.senderType === "contact" ? ("user" as const) : ("assistant" as const),
      content: m.content!,
    }));

  const summary = await summarizeConversation(history);

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { aiSummary: summary },
  });

  return NextResponse.json({ summary });
});
