import { prisma } from "@/lib/prisma";
import { sendPlatformMessage } from "@/lib/integrations/send-message";
import { sendLineMessage, buildLineButtonMessage, type LineCredentials } from "@/lib/integrations/line";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlowButton {
  label: string;
  postbackData: string;
}

type FlowStep =
  | { type: "send_message"; content: string; buttons?: FlowButton[] }
  | { type: "send_image"; imageUrl: string; caption?: string }
  | { type: "condition"; field: "message" | "tag" | "segment"; operator: "contains" | "equals" | "not_contains"; value: string; gotoStep: number; elseStep: number }
  | { type: "wait_reply"; timeoutSeconds?: number }
  | { type: "assign_agent"; agentId: string }
  | { type: "set_tag"; tag: string }
  | { type: "delay"; seconds: number }
  | { type: "ai_reply" }
  | { type: "end_flow" };

interface FlowTrigger {
  type: "first_message" | "keyword" | "postback";
  keywords?: string[];
  data?: string;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Process a flow for an incoming message. Returns true if a flow was triggered
 * (callers should skip AI bot when true).
 */
export async function processFlowForMessage(params: {
  conversationId: string;
  messageContent: string;
  orgId: string;
  eventType?: "message" | "postback";
  postbackData?: string;
}): Promise<boolean> {
  const { conversationId, messageContent, orgId, eventType = "message", postbackData } = params;

  // Check for active session first
  const activeSession = await prisma.flowSession.findFirst({
    where: { conversationId, status: "active" },
    include: { flow: true },
  });

  if (activeSession) {
    const steps = activeSession.flow.steps as FlowStep[];
    await executeFromStep(activeSession.id, steps, activeSession.currentStep, conversationId, messageContent, postbackData);
    return true;
  }

  // No active session — find matching flow
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
      const session = await prisma.flowSession.create({
        data: { flowId: flow.id, conversationId },
      });
      const steps = flow.steps as FlowStep[];
      await executeFromStep(session.id, steps, 0, conversationId, messageContent, postbackData);
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
      return ageMs < 60_000; // within 1 minute of creation
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

// ─── Step Execution ──────────────────────────────────────────────────────────

async function executeFromStep(
  sessionId: string,
  steps: FlowStep[],
  startIdx: number,
  conversationId: string,
  messageContent: string,
  postbackData?: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      contact: { select: { id: true, platformId: true, tags: true, segment: true } },
      channel: { select: { platform: true, credentials: true } },
    },
  });
  if (!conversation) return;

  let i = startIdx;
  const maxSteps = 20; // prevent infinite loops
  let executedCount = 0;

  while (i < steps.length && executedCount < maxSteps) {
    const step = steps[i];
    executedCount++;

    switch (step.type) {
      case "send_message": {
        if (step.buttons?.length && conversation.channel.platform === "line") {
          const creds = conversation.channel.credentials as unknown as LineCredentials;
          const flexMsg = buildLineButtonMessage(step.content, step.buttons.map((b) => ({
            label: b.label,
            type: "postback" as const,
            data: b.postbackData,
          })));
          await sendLineMessage(creds, conversation.contact.platformId, [flexMsg as never]);
        } else {
          await sendPlatformMessage({
            platform: conversation.channel.platform,
            credentials: conversation.channel.credentials,
            recipientId: conversation.contact.platformId,
            text: step.content,
          });
        }

        await prisma.message.create({
          data: {
            conversationId,
            senderType: "bot",
            content: step.content,
            contentType: "text",
            metadata: { source: "flow", sessionId },
          },
        });
        i++;
        break;
      }

      case "send_image": {
        await sendPlatformMessage({
          platform: conversation.channel.platform,
          credentials: conversation.channel.credentials,
          recipientId: conversation.contact.platformId,
          imageUrl: step.imageUrl,
        });
        await prisma.message.create({
          data: {
            conversationId,
            senderType: "bot",
            content: step.caption ?? null,
            contentType: "image",
            mediaUrl: step.imageUrl,
            metadata: { source: "flow", sessionId },
          },
        });
        i++;
        break;
      }

      case "condition": {
        let fieldValue = "";
        if (step.field === "message") fieldValue = messageContent;
        else if (step.field === "tag") fieldValue = (conversation.contact.tags ?? []).join(",");
        else if (step.field === "segment") fieldValue = conversation.contact.segment ?? "";

        let match = false;
        if (step.operator === "contains") match = fieldValue.toLowerCase().includes(step.value.toLowerCase());
        else if (step.operator === "equals") match = fieldValue.toLowerCase() === step.value.toLowerCase();
        else if (step.operator === "not_contains") match = !fieldValue.toLowerCase().includes(step.value.toLowerCase());

        i = match ? step.gotoStep : step.elseStep;
        break;
      }

      case "wait_reply": {
        await prisma.flowSession.update({
          where: { id: sessionId },
          data: { currentStep: i + 1 },
        });
        return; // pause — next message will resume
      }

      case "assign_agent": {
        const agentId = step.agentId === "auto" ? undefined : step.agentId;
        if (agentId) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { assignedTo: agentId, status: "open" },
          });
        }
        i++;
        break;
      }

      case "set_tag": {
        const currentTags = conversation.contact.tags ?? [];
        if (!currentTags.includes(step.tag)) {
          await prisma.contact.update({
            where: { id: conversation.contact.id },
            data: { tags: [...currentTags, step.tag] },
          });
        }
        i++;
        break;
      }

      case "delay": {
        await new Promise((r) => setTimeout(r, Math.min(step.seconds, 10) * 1000));
        i++;
        break;
      }

      case "ai_reply": {
        // Delegate to AI bot — mark session complete and let AI handle
        await prisma.flowSession.update({
          where: { id: sessionId },
          data: { status: "completed", completedAt: new Date(), currentStep: i },
        });
        return; // AI bot will handle from here
      }

      case "end_flow":
      default: {
        await prisma.flowSession.update({
          where: { id: sessionId },
          data: { status: "completed", completedAt: new Date(), currentStep: i },
        });
        return;
      }
    }
  }

  // Reached end of steps
  await prisma.flowSession.update({
    where: { id: sessionId },
    data: { status: "completed", completedAt: new Date(), currentStep: i },
  });
}
