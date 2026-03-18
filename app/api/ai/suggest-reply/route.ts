import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { suggestReply } from "@/lib/gemini";
import { searchKb, formatKbContext } from "@/lib/kb";
import { getErpConfig, erpFetch } from "@/lib/erp";
import { AI_BOT_ERP_TIMEOUT } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  if (!checkRateLimit(`ai-suggest:${user.id}`, 10, 60_000)) {
    return jsonError("Rate limit exceeded. Try again in a minute.", 429);
  }
  const { conversationId, count = 1 } = (await req.json()) as { conversationId: string; count?: number };
  if (!conversationId) return jsonError("conversationId required", 400);
  const numSuggestions = Math.min(Math.max(1, count), 3);

  const [org, conversation] = await Promise.all([
    prisma.organization.findUnique({ where: { id: user.orgId } }),
    prisma.conversation.findFirst({
      where: { id: conversationId, orgId: user.orgId },
      include: {
        contact: { select: { displayName: true, segment: true, totalOrders: true, platform: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20,
          where: { content: { not: null } },
          select: { content: true, senderType: true },
        },
      },
    }),
  ]);

  if (!org) return jsonError("Organization not found", 404);
  if (!conversation) return jsonError("Conversation not found", 404);

  const history = conversation.messages.slice(-10).map((m) => ({
    role: m.senderType === "contact" ? ("user" as const) : ("assistant" as const),
    content: m.content!,
  }));

  if (history.length === 0) return jsonError("No messages to analyze", 400);

  const lastMessage = history[history.length - 1];
  const kbResults = await searchKb(user.orgId, lastMessage.content, 3);
  const kbContext = formatKbContext(kbResults);

  let erpContext = "";
  const erpConfig = getErpConfig(org.settings);
  if (erpConfig?.erpEnabled) {
    try {
      const erpRes = await erpFetch(erpConfig, `/products?q=${encodeURIComponent(lastMessage.content)}&limit=3`, {
        signal: AbortSignal.timeout(AI_BOT_ERP_TIMEOUT),
      });
      if (erpRes.ok) {
        const data = (await erpRes.json()) as unknown[];
        erpContext = JSON.stringify(data);
      }
    } catch {
      // ERP unavailable — continue without it
    }
  }

  const botConfig = await prisma.aiBotConfig.findFirst({
    where: { orgId: user.orgId, isActive: true },
    orderBy: { channelId: "desc" },
  });

  const contactProfile = {
    name: conversation.contact.displayName,
    segment: conversation.contact.segment,
    totalOrders: conversation.contact.totalOrders,
    platform: conversation.contact.platform,
  };

  const results = await Promise.all(
    Array.from({ length: numSuggestions }, () =>
      suggestReply({
        conversationHistory: history,
        contactProfile,
        kbContext,
        erpContext,
        shopName: org.name,
        persona: botConfig?.persona,
      })
    )
  );

  const suggestions = results.map((r) => ({
    reply: r.reply,
    confidence: r.confidence,
    sentiment: r.sentiment,
    shouldEscalate: r.shouldEscalate,
  }));

  // Deduplicate by reply text
  const seen = new Set<string>();
  const unique = suggestions.filter((s) => {
    if (seen.has(s.reply)) return false;
    seen.add(s.reply);
    return true;
  });

  // Backward compatible: single suggestion fields + suggestions array
  const first = unique[0];
  return NextResponse.json({
    reply: first.reply,
    confidence: first.confidence,
    sentiment: first.sentiment,
    shouldEscalate: first.shouldEscalate,
    suggestions: unique,
  });
});
