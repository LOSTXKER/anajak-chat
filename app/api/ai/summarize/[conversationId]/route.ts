import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { summarizeConversation } from "@/lib/gemini";
import type { Sentiment } from "@/lib/generated/prisma/client";

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

  const analysis = await summarizeConversation(history);

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      aiSummary: analysis.summary,
      aiSentiment: analysis.sentiment as Sentiment,
      aiIntent: analysis.intent,
    },
  });

  return NextResponse.json({
    summary: analysis.summary,
    sentiment: analysis.sentiment,
    intent: analysis.intent,
  });
});
