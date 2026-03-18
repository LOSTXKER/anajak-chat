import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { copilotChat } from "@/lib/gemini";
import { searchKb, formatKbContext } from "@/lib/kb";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  if (!checkRateLimit(`ai-copilot:${user.id}`, 20, 60_000)) {
    return jsonError("Rate limit exceeded. Try again in a minute.", 429);
  }

  const { conversationId, question, history } = (await req.json()) as {
    conversationId: string;
    question: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!conversationId || !question) {
    return jsonError("conversationId and question required", 400);
  }

  const [org, conversation] = await Promise.all([
    prisma.organization.findUnique({ where: { id: user.orgId } }),
    prisma.conversation.findFirst({
      where: { id: conversationId, orgId: user.orgId },
      include: {
        contact: { select: { displayName: true, segment: true, totalOrders: true, platform: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 15,
          where: { content: { not: null } },
          select: { content: true, senderType: true },
        },
      },
    }),
  ]);

  if (!org) return jsonError("Organization not found", 404);
  if (!conversation) return jsonError("Conversation not found", 404);

  const conversationHistory = conversation.messages.map((m) => ({
    role: m.senderType === "contact" ? ("user" as const) : ("assistant" as const),
    content: m.content!,
  }));

  const kbResults = await searchKb(user.orgId, question, 3);
  const kbContext = formatKbContext(kbResults);

  const answer = await copilotChat({
    question,
    conversationHistory,
    contactProfile: {
      name: conversation.contact.displayName,
      segment: conversation.contact.segment,
      totalOrders: conversation.contact.totalOrders,
      platform: conversation.contact.platform,
    },
    kbContext,
    shopName: org.name,
    chatHistory: history,
  });

  return NextResponse.json({ answer });
});
