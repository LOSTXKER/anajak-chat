import { prisma } from "@/lib/prisma";
import { suggestReply } from "@/lib/gemini";
import { searchKb, formatKbContext } from "@/lib/kb";
import { getErpConfig, erpFetch } from "@/lib/erp";
import { isWithinBusinessHours, extractBusinessHours } from "@/lib/business-hours";
import { sendPlatformMessage } from "@/lib/integrations/send-message";
import { createNotification } from "@/lib/notifications";
import type { AiBotMode } from "@/lib/generated/prisma/client";

export async function processIncomingMessage(params: {
  conversationId: string;
  messageContent: string;
  orgId: string;
}) {
  const { conversationId, messageContent, orgId } = params;

  try {
    const [org, conversation] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          contact: { select: { displayName: true, segment: true, totalOrders: true, platform: true } },
          channel: { select: { platform: true, credentials: true } },
          messages: { orderBy: { createdAt: "asc" }, take: 20, select: { content: true, senderType: true } },
        },
      }),
    ]);

    if (!org || !conversation) return;

    // Get AI bot config (channel-specific first, then org-wide default)
    const botConfig = await prisma.aiBotConfig.findFirst({
      where: {
        orgId,
        isActive: true,
        OR: [{ channelId: conversation.channelId }, { channelId: null }],
      },
      orderBy: { channelId: "desc" }, // channel-specific takes priority
    });

    if (!botConfig || botConfig.mode === "off") return;

    // Determine effective mode based on business hours hybrid setting
    let effectiveMode: AiBotMode = botConfig.mode;
    if (botConfig.useBusinessHours) {
      const bhSettings = extractBusinessHours(org.settings);
      const isOpen = isWithinBusinessHours(bhSettings);
      effectiveMode = isOpen ? botConfig.manualMode : botConfig.autoMode;
    }
    if (effectiveMode === "off") return;

    // Count AI rounds in this conversation
    const aiRoundCount = await prisma.aiReplyLog.count({
      where: { conversationId, orgId },
    });
    if (aiRoundCount >= botConfig.escalationMaxRounds) return;

    // Build conversation history (last 10 messages)
    const history = conversation.messages.slice(-10).map((m) => ({
      role: m.senderType === "contact" ? ("user" as const) : ("assistant" as const),
      content: m.content ?? "",
    }));

    // Search KB for relevant context
    const kbResults = await searchKb(orgId, messageContent, 3);
    const kbContext = formatKbContext(kbResults);

    // Try to get ERP product data if question seems product-related
    let erpContext = "";
    const erpConfig = getErpConfig(org.settings);
    if (erpConfig?.erpEnabled && /สินค้า|ราคา|stock|มีมั้ย|มีไหม|เหลือ/i.test(messageContent)) {
      try {
        const erpRes = await erpFetch(erpConfig, `/products?q=${encodeURIComponent(messageContent)}&limit=3`, {
          signal: AbortSignal.timeout(3000),
        });
        if (erpRes.ok) {
          const data = await erpRes.json() as unknown[];
          erpContext = JSON.stringify(data);
        }
      } catch {
        // Skip ERP if unavailable
      }
    }

    const result = await suggestReply({
      conversationHistory: history,
      contactProfile: {
        name: conversation.contact.displayName,
        segment: conversation.contact.segment,
        totalOrders: conversation.contact.totalOrders,
        platform: conversation.contact.platform,
      },
      kbContext,
      erpContext,
      shopName: org.name,
      persona: botConfig.persona,
    });

    // Check escalation rules
    const shouldEscalate =
      result.shouldEscalate ||
      (botConfig.escalationOnNegativeSentiment && result.sentiment === "negative") ||
      (result.confidence < Number(botConfig.escalationOnLowConfidence));

    // Create AI reply log
    const aiLog = await prisma.aiReplyLog.create({
      data: {
        orgId,
        conversationId,
        mode: effectiveMode,
        draftContent: result.reply,
        status: shouldEscalate ? "escalated" : effectiveMode === "full_auto" ? "auto_sent" : "pending_review",
        confidence: result.confidence,
        shouldEscalate,
        escalateReason: result.escalateReason,
        usedSources: result.usedSources,
        kbArticleIds: kbResults.map((k) => k.id),
      },
    });

    if (shouldEscalate) {
      // Notify assigned agent (or all agents if unassigned)
      if (conversation.assignedTo) {
        await createNotification({
          orgId,
          userId: conversation.assignedTo,
          type: "system",
          title: "AI ต้องการให้แอดมินช่วย",
          body: result.escalateReason ?? "ลูกค้าต้องการความช่วยเหลือ",
          link: `/inbox?conversationId=${conversationId}`,
        });
      }
      return;
    }

    if (effectiveMode === "full_auto") {
      // Send message automatically
      await sendAutoMessage({
        content: result.reply,
        conversation,
        conversationId,
        aiLogId: aiLog.id,
      });
    } else {
      // Confirm mode: notify agent about pending draft
      if (conversation.assignedTo) {
        await createNotification({
          orgId,
          userId: conversation.assignedTo,
          type: "system",
          title: "AI ร่างคำตอบรอ approve",
          body: result.reply.slice(0, 80),
          link: `/inbox?conversationId=${conversationId}`,
        });
      }
    }
  } catch {
    // Silently fail AI processing to not block webhook
  }
}

async function sendAutoMessage(params: {
  content: string;
  conversation: {
    channel: { platform: string; credentials: unknown };
    contact: { platform: string };
    assignedTo?: string | null;
  };
  conversationId: string;
  aiLogId: string;
}) {
  const { content, conversation, conversationId, aiLogId } = params;
  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: { select: { platformId: true } } },
    });
    if (!conv) return;

    await sendPlatformMessage({
      platform: conversation.channel.platform,
      credentials: conversation.channel.credentials,
      recipientId: conv.contact.platformId,
      text: content,
    });

    // Save message in DB
    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderType: "bot",
        senderId: null,
        content,
        contentType: "text",
        platformMessageId: `ai-${aiLogId}`,
        metadata: { aiLogId, source: "ai_bot" },
      },
    });

    // Update AI log with message ID and final content
    await prisma.aiReplyLog.update({
      where: { id: aiLogId },
      data: { messageId: msg.id, finalContent: content },
    });
  } catch {
    // Failed to send
  }
}
