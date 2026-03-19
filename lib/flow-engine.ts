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
}

interface PlatformSteps {
  _default: AutoReplyPattern;
  line?: AutoReplyPattern;
  facebook?: AutoReplyPattern;
  instagram?: AutoReplyPattern;
  assignToHuman?: boolean;
}

function resolvePlatformPattern(raw: unknown, platform: string): { pattern: AutoReplyPattern; assignToHuman: boolean } {
  if (!raw || typeof raw !== "object") return { pattern: { messages: [] }, assignToHuman: false };
  const obj = raw as Record<string, unknown>;
  if ("_default" in obj && typeof obj._default === "object") {
    const steps = obj as unknown as PlatformSteps;
    const pattern = (steps[platform as keyof PlatformSteps] as AutoReplyPattern | undefined) ?? steps._default;
    return { pattern, assignToHuman: steps.assignToHuman ?? false };
  }
  if ("messages" in obj) {
    const legacy = obj as unknown as AutoReplyPattern & { assignToHuman?: boolean };
    return { pattern: { messages: legacy.messages ?? [], quickReplies: legacy.quickReplies }, assignToHuman: legacy.assignToHuman ?? false };
  }
  return { pattern: { messages: [] }, assignToHuman: false };
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
      const channel = await prisma.channel.findUnique({ where: { id: conversation.channelId }, select: { platform: true } });
      const { pattern, assignToHuman } = resolvePlatformPattern(flow.steps, channel?.platform ?? "_default");
      if (!pattern?.messages?.length) continue;

      const session = await prisma.flowSession.create({
        data: { flowId: flow.id, conversationId },
      });

      await executeAutoReply(session.id, pattern, assignToHuman, conversationId);
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
  assignToHuman: boolean,
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

  if (assignToHuman) {
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
