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

export async function processFlowForMessage(params: {
  conversationId: string;
  messageContent: string;
  orgId: string;
  eventType?: "message" | "postback";
  postbackData?: string;
  replyToken?: string;
}): Promise<boolean> {
  const { conversationId, messageContent, orgId, eventType = "message", postbackData, replyToken } = params;

  console.log(`[FlowEngine] Processing: orgId=${orgId}, content="${messageContent.slice(0, 50)}", eventType=${eventType}`);

  const flows = await prisma.chatFlow.findMany({
    where: { orgId, isActive: true },
    orderBy: { priority: "desc" },
  });

  console.log(`[FlowEngine] Found ${flows.length} active flow(s)`);

  if (flows.length === 0) return false;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { channelId: true },
  });
  if (!conversation) {
    console.warn(`[FlowEngine] Conversation ${conversationId} not found`);
    return false;
  }

  for (const flow of flows) {
    if (flow.channelId && flow.channelId !== conversation.channelId) continue;

    const trigger = flow.trigger as unknown as FlowTrigger;
    const matched = await matchesTrigger(trigger, messageContent, eventType, postbackData, conversationId);

    console.log(`[FlowEngine] Flow "${flow.name}" (${trigger.type}): ${matched ? "MATCHED" : "no match"}`);

    if (matched) {
      const channel = await prisma.channel.findUnique({ where: { id: conversation.channelId }, select: { platform: true } });
      const { pattern, assignToHuman } = resolvePlatformPattern(flow.steps, channel?.platform ?? "_default");

      if (!pattern?.messages?.length) {
        console.warn(`[FlowEngine] Flow "${flow.name}" matched but has no messages`);
        continue;
      }

      console.log(`[FlowEngine] Executing flow "${flow.name}" with ${pattern.messages.length} message(s), platform=${channel?.platform ?? "_default"}`);

      const session = await prisma.flowSession.upsert({
        where: { flowId_conversationId: { flowId: flow.id, conversationId } },
        create: { flowId: flow.id, conversationId },
        update: { status: "active", currentStep: 0, completedAt: null, startedAt: new Date() },
      });

      await executeAutoReply(session.id, pattern, assignToHuman, conversationId, replyToken);
      return true;
    }
  }

  console.log("[FlowEngine] No flow matched");
  return false;
}

// ─── Trigger Matching ────────────────────────────────────────────────────────

async function matchesTrigger(
  trigger: FlowTrigger,
  messageContent: string,
  eventType: string,
  postbackData?: string,
  conversationId?: string,
): Promise<boolean> {
  switch (trigger.type) {
    case "first_message": {
      if (!conversationId) return false;
      const customerMsgCount = await prisma.message.count({
        where: { conversationId, senderType: "contact" },
      });
      return customerMsgCount <= 1;
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
  conversationId: string,
  replyToken?: string,
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
  let usedReplyToken = false;
  let sentCount = 0;
  const errors: string[] = [];

  console.log(`[FlowEngine] Sending to recipientId=${recipientId}, platform=${platform}, replyToken=${replyToken ? "yes" : "no"}`);

  for (let i = 0; i < pattern.messages.length; i++) {
    const msg = pattern.messages[i];
    try {
      const tokenForThis = (!usedReplyToken && platform === "line" && replyToken) ? replyToken : undefined;

      console.log(`[FlowEngine] Sending message ${i + 1}/${pattern.messages.length}: type=${msg.type}${tokenForThis ? " (Reply API)" : " (Push API)"}`);

      const ok = await sendAutoReplyMessage({ platform, credentials, recipientId, message: msg, replyToken: tokenForThis });

      if (tokenForThis) usedReplyToken = true;

      if (ok) {
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
            metadata: { source: "auto_reply", sessionId },
          },
        });
      } else {
        const errMsg = `Message ${i + 1} (${msg.type}) failed to send`;
        console.error(`[FlowEngine] ${errMsg}`);
        errors.push(errMsg);
      }
    } catch (e) {
      const errMsg = `Message ${i + 1} error: ${e instanceof Error ? e.message : String(e)}`;
      console.error(`[FlowEngine] ${errMsg}`);
      errors.push(errMsg);
    }
  }

  if (assignToHuman) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "open" },
    });
  }

  const finalStatus = sentCount > 0 ? "completed" : "failed";
  await prisma.flowSession.update({
    where: { id: sessionId },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      currentStep: sentCount,
      variables: { sentCount, totalMessages: pattern.messages.length, errors: errors.length > 0 ? errors : undefined },
    },
  });

  console.log(`[FlowEngine] Session ${sessionId} ${finalStatus}: sent ${sentCount}/${pattern.messages.length}${errors.length > 0 ? `, errors: ${errors.join("; ")}` : ""}`);
}
