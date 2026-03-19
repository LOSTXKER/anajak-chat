import { prisma } from "@/lib/prisma";
import { sendAutoReplyMessage, type AutoReplyMessage, type SendResult } from "@/lib/integrations/send-message";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AutoReplyPattern {
  messages: AutoReplyMessage[];
  quickReplies?: { label: string; action: "message" | "postback"; value: string }[];
}

interface PlatformMessages {
  _default?: AutoReplyPattern;
  line?: AutoReplyPattern;
  facebook?: AutoReplyPattern;
  instagram?: AutoReplyPattern;
}

export interface IntentMatchResult {
  intentId: string;
  intentName: string;
  messageSetId: string;
  assignToHuman: boolean;
}

export interface ExecuteResult {
  success: boolean;
  sentCount: number;
  totalMessages: number;
  errors: string[];
}

// ─── Intent Matching (fast, minimal DB) ─────────────────────────────────────

export async function matchIntents(params: {
  orgId: string;
  messageContent: string;
  eventType?: "message" | "postback";
  postbackData?: string;
  conversationId?: string;
  channelId?: string;
}): Promise<IntentMatchResult | null> {
  const { orgId, messageContent, eventType = "message", postbackData, conversationId, channelId } = params;

  const intents = await prisma.botIntent.findMany({
    where: { orgId, isActive: true },
    orderBy: { priority: "desc" },
    select: {
      id: true, name: true, triggerType: true, keywords: true,
      postbackData: true, messageSetId: true, channelId: true, assignToHuman: true,
    },
  });

  if (intents.length === 0) return null;

  const lower = messageContent.toLowerCase();

  for (const intent of intents) {
    if (intent.channelId && intent.channelId !== channelId) continue;

    let matched = false;

    switch (intent.triggerType) {
      case "keyword":
        matched = intent.keywords.some((kw) => lower.includes(kw.toLowerCase()));
        break;
      case "first_message":
        if (conversationId) {
          const count = await prisma.message.count({
            where: { conversationId, senderType: "contact" },
          });
          matched = count <= 1;
        }
        break;
      case "postback":
        matched = eventType === "postback" && postbackData === intent.postbackData;
        break;
    }

    if (matched) {
      console.log(`[FlowEngine] Intent "${intent.name}" matched (${intent.triggerType})`);
      return {
        intentId: intent.id,
        intentName: intent.name,
        messageSetId: intent.messageSetId,
        assignToHuman: intent.assignToHuman,
      };
    }
  }

  return null;
}

// ─── Resolve Platform Messages ──────────────────────────────────────────────

function resolvePlatformPattern(messagesJson: unknown, platform: string): AutoReplyPattern {
  if (!messagesJson || typeof messagesJson !== "object") return { messages: [] };
  const obj = messagesJson as PlatformMessages;

  if (obj._default) {
    const platformPattern = obj[platform as keyof PlatformMessages] as AutoReplyPattern | undefined;
    return platformPattern?.messages?.length ? platformPattern : (obj._default ?? { messages: [] });
  }

  if ("messages" in (messagesJson as Record<string, unknown>)) {
    return messagesJson as AutoReplyPattern;
  }

  return { messages: [] };
}

// ─── Execute Intent (send messages) ─────────────────────────────────────────

export async function executeIntent(params: {
  match: IntentMatchResult;
  platform: string;
  credentials: unknown;
  recipientId: string;
  conversationId: string;
  replyToken?: string;
}): Promise<ExecuteResult> {
  const { match, platform, credentials, recipientId, conversationId, replyToken } = params;

  const messageSet = await prisma.messageSet.findUnique({
    where: { id: match.messageSetId },
    select: { messages: true },
  });

  if (!messageSet) {
    return { success: false, sentCount: 0, totalMessages: 0, errors: ["MessageSet not found"] };
  }

  const pattern = resolvePlatformPattern(messageSet.messages, platform);

  if (!pattern.messages.length) {
    return { success: false, sentCount: 0, totalMessages: 0, errors: ["No messages configured"] };
  }

  console.log(`[FlowEngine] Sending ${pattern.messages.length} message(s) to ${recipientId} via ${platform}${replyToken ? " (replyToken available)" : ""}`);

  let sentCount = 0;
  const errors: string[] = [];
  let usedReplyToken = false;

  for (let i = 0; i < pattern.messages.length; i++) {
    const msg = pattern.messages[i];
    const tokenForThis = (!usedReplyToken && platform === "line" && replyToken) ? replyToken : undefined;

    let result: SendResult;
    try {
      result = await sendAutoReplyMessage({
        platform, credentials, recipientId, message: msg, replyToken: tokenForThis,
      });
    } catch (e) {
      result = { ok: false, error: `Exception: ${e instanceof Error ? e.message : String(e)}` };
    }

    if (tokenForThis) usedReplyToken = true;

    if (result.ok) {
      sentCount++;
      const contentType = msg.type === "image" ? "image" : msg.type === "video" ? "file" : "text";
      const content = msg.text ?? msg.cardTitle ?? msg.fileName ?? (msg.type === "sticker" ? "[Sticker]" : null);

      await prisma.message.create({
        data: {
          conversationId,
          senderType: "bot",
          content,
          contentType,
          mediaUrl: msg.imageUrl ?? msg.fileUrl ?? msg.videoUrl ?? null,
          metadata: { source: "auto_reply", intentId: match.intentId },
        },
      }).catch((e) => console.error("[FlowEngine] Failed to save bot message:", e));
    } else {
      errors.push(`Msg ${i + 1} (${msg.type}): ${result.error ?? "unknown error"}`);
    }
  }

  if (match.assignToHuman) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "open" },
    }).catch((e) => console.error("[FlowEngine] Failed to update conversation status:", e));
  }

  const session = await prisma.intentSession.create({
    data: {
      intentId: match.intentId,
      conversationId,
      status: sentCount > 0 ? "completed" : "failed",
      sentCount,
      totalMessages: pattern.messages.length,
      errors,
      completedAt: new Date(),
    },
  }).catch((e) => {
    console.error("[FlowEngine] Failed to create session:", e);
    return null;
  });

  console.log(`[FlowEngine] ${session?.status ?? "error"}: sent ${sentCount}/${pattern.messages.length}${errors.length ? ` | ${errors.join("; ")}` : ""}`);

  return { success: sentCount > 0, sentCount, totalMessages: pattern.messages.length, errors };
}

// ─── Convenience: Match + Execute ───────────────────────────────────────────

export async function processMessageForIntents(params: {
  orgId: string;
  conversationId: string;
  channelId: string;
  messageContent: string;
  platform: string;
  credentials: unknown;
  recipientId: string;
  eventType?: "message" | "postback";
  postbackData?: string;
  replyToken?: string;
}): Promise<boolean> {
  const match = await matchIntents({
    orgId: params.orgId,
    messageContent: params.messageContent,
    eventType: params.eventType,
    postbackData: params.postbackData,
    conversationId: params.conversationId,
    channelId: params.channelId,
  });

  if (!match) return false;

  const result = await executeIntent({
    match,
    platform: params.platform,
    credentials: params.credentials,
    recipientId: params.recipientId,
    conversationId: params.conversationId,
    replyToken: params.replyToken,
  });

  return result.success;
}
