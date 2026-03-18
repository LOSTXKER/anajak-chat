import { prisma } from "@/lib/prisma";
import { sendAutoReplyMessage, type AutoReplyMessage } from "@/lib/integrations/send-message";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlowTrigger {
  type: "first_message" | "keyword" | "postback";
  keywords?: string[];
  data?: string;
}

interface QuickReplyItem {
  label: string;
  action: "message" | "postback";
  value: string;
}

interface AutoReplyPattern {
  messages: AutoReplyMessage[];
  quickReplies?: QuickReplyItem[];
  assignToHuman?: boolean;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Process auto-reply patterns for an incoming message.
 * Returns true if a pattern was triggered (callers should skip AI bot).
 */
export async function processFlowForMessage(params: {
  conversationId: string;
  messageContent: string;
  orgId: string;
  eventType?: "message" | "postback";
  postbackData?: string;
}): Promise<boolean> {
  const { conversationId, messageContent, orgId, eventType = "message", postbackData } = params;

  const flows = await prisma.chatFlow.findMany({
    where: { orgId, isActive: true },
    orderBy: { priority: "desc" },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { channelId: true, createdAt: true },
  });
  if (!conversation) return false;

  for (const flow of flows) {
    if (flow.channelId && flow.channelId !== conversation.channelId) continue;

    const trigger = flow.trigger as unknown as FlowTrigger;

    if (matchesTrigger(trigger, messageContent, eventType, postbackData, conversation.createdAt)) {
      const pattern = flow.steps as unknown as AutoReplyPattern;
      if (!pattern?.messages?.length) continue;

      const session = await prisma.flowSession.create({
        data: { flowId: flow.id, conversationId },
      });

      await executeAutoReply(session.id, pattern, conversationId);
      return true;
    }
  }

  return false;
}

// ─── Trigger Matching ────────────────────────────────────────────────────────

function matchesTrigger(
  trigger: FlowTrigger,
  messageContent: string,
  eventType: string,
  postbackData?: string,
  conversationCreatedAt?: Date
): boolean {
  switch (trigger.type) {
    case "first_message": {
      if (!conversationCreatedAt) return false;
      const ageMs = Date.now() - conversationCreatedAt.getTime();
      return ageMs < 60_000;
    }
    case "keyword":
      return (trigger.keywords ?? []).some((kw) =>
        messageContent.toLowerCase().includes(kw.toLowerCase())
      );
    case "postback":
      return eventType === "postback" && postbackData === trigger.data;
    default:
      return false;
  }
}

// ─── Auto-Reply Execution ────────────────────────────────────────────────────

async function executeAutoReply(
  sessionId: string,
  pattern: AutoReplyPattern,
  conversationId: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      contact: { select: { id: true, platformId: true } },
      channel: { select: { platform: true, credentials: true } },
    },
  });
  if (!conversation) return;

  const { platform, credentials } = conversation.channel;
  const recipientId = conversation.contact.platformId;

  for (const msg of pattern.messages) {
    try {
      await sendAutoReplyMessage({ platform, credentials, recipientId, message: msg });

      const contentType = msg.type === "image" ? "image" : msg.type === "video" ? "file" : "text";
      const content = msg.text ?? msg.cardTitle ?? msg.fileName ?? (msg.type === "sticker" ? "[Sticker]" : null);

      await prisma.message.create({
        data: {
          conversationId,
          senderType: "bot",
          content,
          contentType,
          mediaUrl: msg.imageUrl ?? msg.fileUrl ?? msg.videoUrl ?? null,
          metadata: { source: "auto_reply", sessionId },
        },
      });
    } catch (e) {
      console.error("[AutoReply] send message error:", e);
    }
  }

  if (pattern.assignToHuman) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "open" },
    });
  }

  await prisma.flowSession.update({
    where: { id: sessionId },
    data: { status: "completed", completedAt: new Date(), currentStep: pattern.messages.length },
  });
}
