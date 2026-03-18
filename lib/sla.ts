import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { SLA_WARNING_THRESHOLD_PERCENT, DEFAULT_SLA_CONFIG } from "@/lib/constants";

/**
 * Compute response deadline from a given start time.
 */
export function computeResponseDeadline(startTime: Date, responseMinutes: number): Date {
  return new Date(startTime.getTime() + responseMinutes * 60 * 1000);
}

/**
 * Get SLA response minutes for an org (from config or default).
 */
export async function getSlaMinutes(orgId: string): Promise<number | null> {
  const config = await prisma.slaConfig.findFirst({
    where: { orgId, priority: "medium", isActive: true },
  });

  if (config) return config.firstResponseMinutes;
  return DEFAULT_SLA_CONFIG.responseMinutes;
}

/**
 * Set SLA deadline on a conversation. Called when:
 * - A new conversation is created (customer sends first message)
 * - A customer sends a new message while waiting for agent reply
 */
export async function setSlaDeadline(
  conversationId: string,
  orgId: string,
  messageTime: Date
): Promise<void> {
  const minutes = await getSlaMinutes(orgId);
  if (!minutes) return;

  const deadline = computeResponseDeadline(messageTime, minutes);

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      slaFirstResponseDeadline: deadline,
      slaBreachedAt: null,
      slaWarningAt: null,
    },
  });
}

/**
 * Clear SLA deadline when agent responds.
 */
export async function clearSlaDeadline(conversationId: string): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      slaFirstResponseDeadline: null,
      slaBreachedAt: null,
      slaWarningAt: null,
    },
  });
}

/**
 * Called by the cron job to process SLA breaches for an org.
 */
export async function processSlaBreaches(orgId: string): Promise<void> {
  const slaConfigs = await prisma.slaConfig.findMany({
    where: { orgId, isActive: true },
  });

  if (slaConfigs.length === 0) return;

  const now = new Date();

  const conversations = await prisma.conversation.findMany({
    where: {
      orgId,
      status: { in: ["open", "pending"] },
      slaBreachedAt: null,
      slaFirstResponseDeadline: { lte: now },
    },
    select: {
      id: true,
      status: true,
      priority: true,
      assignedTo: true,
      slaFirstResponseDeadline: true,
    },
  });

  const configMap = new Map(slaConfigs.map((c) => [c.priority, c]));

  for (const conv of conversations) {
    const config = configMap.get(conv.priority);

    const breachData: Record<string, unknown> = { slaBreachedAt: now };

    if (conv.status === "pending") {
      const existing = await prisma.conversation.findUnique({
        where: { id: conv.id },
        select: { labels: true },
      });
      const currentLabels = existing?.labels ?? [];
      if (!currentLabels.includes("missed")) {
        breachData.labels = [...currentLabels, "missed"];
      }
    }

    await prisma.conversation.update({
      where: { id: conv.id },
      data: breachData,
    });

    if (conv.assignedTo) {
      await createNotification({
        orgId,
        userId: conv.assignedTo,
        type: "sla_breach",
        title: "SLA Breach! ต้องการการตอบกลับทันที",
        body: `การสนทนายังไม่ได้รับการตอบกลับและเกิน SLA แล้ว`,
        link: `/inbox`,
      }).catch((e) => console.error("[SLA] notification error:", e));
    }

    if (config?.escalateTo) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { assignedTo: config.escalateTo },
      });

      await prisma.conversationEvent.create({
        data: {
          conversationId: conv.id,
          eventType: "sla_escalated",
          metadata: {
            from: conv.assignedTo,
            to: config.escalateTo,
            reason: "sla_breach",
          },
        },
      });

      await createNotification({
        orgId,
        userId: config.escalateTo,
        type: "sla_breach",
        title: "แชทถูก escalate มาให้คุณ (SLA Breach)",
        body: `การสนทนายังไม่ได้รับการตอบกลับและเกิน SLA`,
        link: `/inbox`,
      }).catch((e) => console.error("[SLA] notification error:", e));
    }
  }

  // Warning: conversations approaching deadline
  const warningConvs = await prisma.conversation.findMany({
    where: {
      orgId,
      status: { in: ["open", "pending"] },
      slaBreachedAt: null,
      slaWarningAt: null,
      slaFirstResponseDeadline: { not: null },
    },
    select: {
      id: true,
      priority: true,
      assignedTo: true,
      slaFirstResponseDeadline: true,
    },
  });

  for (const conv of warningConvs) {
    if (!conv.slaFirstResponseDeadline) continue;

    const minutes = await getSlaMinutes(orgId);
    if (!minutes) continue;

    const totalDurationMs = minutes * 60 * 1000;
    const deadlineMs = conv.slaFirstResponseDeadline.getTime();
    const startMs = deadlineMs - totalDurationMs;
    const elapsed = now.getTime() - startMs;
    const percentElapsed = totalDurationMs > 0 ? (elapsed / totalDurationMs) * 100 : 0;

    if (percentElapsed >= 100 - SLA_WARNING_THRESHOLD_PERCENT) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { slaWarningAt: now },
      });

      if (conv.assignedTo) {
        await createNotification({
          orgId,
          userId: conv.assignedTo,
          type: "sla_warning",
          title: "SLA Warning — ใกล้ถึงกำหนดแล้ว",
          body: `การสนทนากำลังจะเกิน SLA ในอีกไม่นาน`,
          link: `/inbox`,
        }).catch((e) => console.error("[SLA] notification error:", e));
      }
    }
  }
}

/**
 * Retroactively apply SLA deadlines to all open/pending conversations
 * that don't have a deadline yet.
 */
export async function applySlaToPendingConversations(
  orgId: string,
  responseMinutes: number
): Promise<number> {
  const conversations = await prisma.conversation.findMany({
    where: {
      orgId,
      status: { in: ["open", "pending"] },
      slaFirstResponseDeadline: null,
      firstResponseAt: null,
    },
    select: { id: true, lastMessageAt: true, createdAt: true },
  });

  if (conversations.length === 0) return 0;

  for (const conv of conversations) {
    const baseTime = conv.lastMessageAt ?? conv.createdAt;
    const deadline = computeResponseDeadline(baseTime, responseMinutes);

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { slaFirstResponseDeadline: deadline },
    });
  }

  return conversations.length;
}
