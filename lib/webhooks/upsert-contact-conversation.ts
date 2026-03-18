import { prisma } from "@/lib/prisma";
import { autoAssignConversation } from "@/lib/assignment";
import { setSlaDeadline } from "@/lib/sla";
import { isWithinBusinessHours, extractBusinessHours } from "@/lib/business-hours";
import { sendPlatformMessage } from "@/lib/integrations/send-message";
import { maybeQueueLeadCapiEvent } from "@/lib/capi-lead-events";
import { processIncomingMessage } from "@/lib/ai-bot";
import { processFlowForMessage } from "@/lib/flow-engine";
import type { Platform } from "@/lib/generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpsertParams {
  orgId: string;
  channelId: string;
  platform: Platform;
  platformUserId: string;
  displayName?: string;
  avatarUrl?: string;
  platformMessageId: string;
  content?: string;
  contentType?: "text" | "image" | "file" | "sticker" | "location" | "template";
  mediaUrl?: string;
  metadata?: Record<string, unknown>;
  adSource?: {
    sourceAdId?: string;
    sourceAdName?: string;
    sourcePlacement?: string;
    sourceCampaignId?: string;
    ctwaClid?: string;
    psid?: string;
    igsid?: string;
  };
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export async function upsertContactAndConversation(params: UpsertParams) {
  const {
    orgId, channelId, platform, platformUserId, displayName, avatarUrl,
    platformMessageId, content, contentType = "text", mediaUrl,
    metadata = {}, adSource,
  } = params;

  const contact = await upsertContact({ orgId, platform, platformUserId, displayName, avatarUrl });

  const conversation = await upsertConversation({ orgId, channelId, contactId: contact.id, adSource, totalConversations: contact.totalConversations });

  const message = await createInboundMessage({
    conversationId: conversation.id, content, contentType, mediaUrl, platformMessageId, metadata,
  });

  // Set SLA deadline every time a customer sends a message
  await setSlaDeadline(conversation.id, orgId, message.createdAt).catch(
    (e) => console.error("[Webhook] SLA set error:", e)
  );

  // Fire-and-forget side effects
  await runPostMessageHooks({ orgId, channelId, platform, platformUserId, conversationId: conversation.id, content });

  return { contact, conversation, message };
}

// ─── Contact ──────────────────────────────────────────────────────────────────

async function upsertContact(params: {
  orgId: string;
  platform: Platform;
  platformUserId: string;
  displayName?: string;
  avatarUrl?: string;
}) {
  return prisma.contact.upsert({
    where: {
      orgId_platformId_platform: {
        orgId: params.orgId,
        platformId: params.platformUserId,
        platform: params.platform,
      },
    },
    create: {
      orgId: params.orgId,
      platformId: params.platformUserId,
      platform: params.platform,
      displayName: params.displayName,
      avatarUrl: params.avatarUrl,
      lastSeenAt: new Date(),
    },
    update: {
      ...(params.displayName && { displayName: params.displayName }),
      ...(params.avatarUrl && { avatarUrl: params.avatarUrl }),
      lastSeenAt: new Date(),
    },
  });
}

// ─── Conversation ─────────────────────────────────────────────────────────────

async function upsertConversation(params: {
  orgId: string;
  channelId: string;
  contactId: string;
  adSource?: UpsertParams["adSource"];
  totalConversations: number;
}) {
  let conversation = await prisma.conversation.findFirst({
    where: {
      contactId: params.contactId,
      channelId: params.channelId,
      status: { in: ["open", "pending", "resolved"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        orgId: params.orgId,
        channelId: params.channelId,
        contactId: params.contactId,
        status: "pending",
        isReturningCustomer: params.totalConversations > 0,
        lastMessageAt: new Date(),
        ...params.adSource,
      },
    });

    await prisma.contact.update({
      where: { id: params.contactId },
      data: { totalConversations: { increment: 1 } },
    });
  } else {
    const needsReopen = conversation.status === "resolved";

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        ...(needsReopen && {
          status: "pending" as const,
          assignedTo: null,
          labels: [],
          startedAt: null,
          slaFirstResponseDeadline: null,
          slaBreachedAt: null,
          slaWarningAt: null,
          firstResponseAt: null,
        }),
      },
    });

    if (needsReopen) {
      conversation = { ...conversation, status: "pending" };
    }
  }

  return conversation;
}

// ─── Message ──────────────────────────────────────────────────────────────────

async function createInboundMessage(params: {
  conversationId: string;
  content?: string;
  contentType: string;
  mediaUrl?: string;
  platformMessageId: string;
  metadata: Record<string, unknown>;
}) {
  return prisma.message.create({
    data: {
      conversationId: params.conversationId,
      senderType: "contact",
      content: params.content,
      contentType: params.contentType as "text" | "image" | "file" | "sticker" | "location" | "template",
      mediaUrl: params.mediaUrl,
      platformMessageId: params.platformMessageId,
      metadata: params.metadata as Record<string, string>,
    },
  });
}

// ─── Post-Message Hooks ───────────────────────────────────────────────────────

async function runPostMessageHooks(params: {
  orgId: string;
  channelId: string;
  platform: Platform;
  platformUserId: string;
  conversationId: string;
  content?: string;
}) {
  const { orgId, channelId, platform, platformUserId, conversationId, content } = params;

  if (content) {
    await maybeQueueLeadCapiEvent({
      orgId, conversationId, channelId, platform,
      contactPlatformId: platformUserId,
      messageContent: content,
    }).catch((e) => console.error("[Webhook] CAPI lead event error:", e));
  }

  await sendBusinessHoursAutoReply({ orgId, conversationId, channelId, platform, contactPlatformId: platformUserId }).catch((e) => console.error("[Webhook] auto-reply error:", e));

  // Run flow engine first — if a flow handles the message, skip AI bot
  if (content) {
    const flowHandled = await processFlowForMessage({
      conversationId, messageContent: content, orgId,
    }).catch((e) => { console.error("[Webhook] flow engine error:", e); return false; });

    if (!flowHandled) {
      await processIncomingMessage({ conversationId, messageContent: content, orgId }).catch((e) => console.error("[Webhook] AI processing error:", e));
    }
  }
}

// ─── Business Hours Auto-Reply ────────────────────────────────────────────────

async function sendBusinessHoursAutoReply(opts: {
  orgId: string;
  conversationId: string;
  channelId: string;
  platform: Platform;
  contactPlatformId: string;
}) {
  const org = await prisma.organization.findUnique({ where: { id: opts.orgId }, select: { settings: true } });
  if (!org) return;

  const bhConfig = extractBusinessHours(org.settings);
  if (isWithinBusinessHours(bhConfig)) return;

  const recentAutoReply = await prisma.message.findFirst({
    where: {
      conversationId: opts.conversationId,
      senderType: "system",
      content: bhConfig.autoReplyMessage,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentAutoReply) return;

  const channel = await prisma.channel.findUnique({ where: { id: opts.channelId }, select: { credentials: true } });
  if (!channel) return;

  try {
    await sendPlatformMessage({
      platform: opts.platform,
      credentials: channel.credentials,
      recipientId: opts.contactPlatformId,
      text: bhConfig.autoReplyMessage,
    });

    await prisma.message.create({
      data: {
        conversationId: opts.conversationId,
        senderType: "system",
        content: bhConfig.autoReplyMessage,
        contentType: "text",
        metadata: { autoReply: true } as Record<string, boolean>,
      },
    });
  } catch {
    // Silently fail auto-reply
  }
}
