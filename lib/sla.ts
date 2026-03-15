import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export type SlaStatus = "ok" | "warning" | "breached" | "none";

interface SlaDeadlineResult {
  firstResponseDeadline: Date | null;
  resolutionDeadline: Date | null;
}

export function computeSlaDeadlines(
  conversationCreatedAt: Date,
  firstResponseMinutes: number,
  resolutionMinutes: number
): SlaDeadlineResult {
  const createdMs = conversationCreatedAt.getTime();
  return {
    firstResponseDeadline: new Date(createdMs + firstResponseMinutes * 60 * 1000),
    resolutionDeadline: new Date(createdMs + resolutionMinutes * 60 * 1000),
  };
}

export function checkSlaStatus(
  deadline: Date | null,
  warningThresholdPercent = 20
): SlaStatus {
  if (!deadline) return "none";
  const now = Date.now();
  const deadlineMs = deadline.getTime();
  if (now >= deadlineMs) return "breached";
  // We need the total span to compute percentage; assume warning at absolute 20% remaining
  return "ok"; // Simplified: specific warning handled by SlaTimer component via deadline proximity
}

/**
 * Called by the cron job to process SLA breaches for an org.
 */
export async function processSlaBreaches(orgId: string): Promise<void> {
  const slaConfigs = await prisma.slaConfig.findMany({
    where: { orgId, isActive: true },
  });

  if (slaConfigs.length === 0) return;

  const configMap = new Map(slaConfigs.map((c) => [c.priority, c]));
  const now = new Date();

  // Find open conversations past their SLA deadlines
  const conversations = await prisma.conversation.findMany({
    where: {
      orgId,
      status: { in: ["open", "pending"] },
      slaBreachedAt: null,
      OR: [
        { slaFirstResponseDeadline: { lte: now } },
        { slaResolutionDeadline: { lte: now } },
      ],
    },
    select: {
      id: true,
      priority: true,
      assignedTo: true,
      firstResponseAt: true,
      slaFirstResponseDeadline: true,
      slaResolutionDeadline: true,
    },
  });

  for (const conv of conversations) {
    const config = configMap.get(conv.priority);
    if (!config) continue;

    const isFirstResponseBreached =
      !conv.firstResponseAt &&
      conv.slaFirstResponseDeadline &&
      conv.slaFirstResponseDeadline <= now;

    const isResolutionBreached =
      conv.slaResolutionDeadline && conv.slaResolutionDeadline <= now;

    if (!isFirstResponseBreached && !isResolutionBreached) continue;

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { slaBreachedAt: now },
    });

    // Notify assigned agent
    if (conv.assignedTo) {
      await createNotification({
        orgId,
        userId: conv.assignedTo,
        type: "sla_breach",
        title: "SLA Breach! ต้องการการตอบกลับทันที",
        body: `การสนทนา priority ${conv.priority} เกิน SLA deadline แล้ว`,
        link: `/inbox`,
      }).catch(() => {});
    }

    // Auto-escalate to supervisor
    if (config.escalateTo) {
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
        body: `การสนทนา priority ${conv.priority} เกิน SLA deadline`,
        link: `/inbox`,
      }).catch(() => {});
    }
  }

  // Update warning status (80% of time elapsed)
  const warningConvs = await prisma.conversation.findMany({
    where: {
      orgId,
      status: { in: ["open", "pending"] },
      slaBreachedAt: null,
      slaWarningAt: null,
      OR: [
        { slaFirstResponseDeadline: { not: null } },
        { slaResolutionDeadline: { not: null } },
      ],
    },
    select: {
      id: true,
      priority: true,
      assignedTo: true,
      createdAt: true,
      firstResponseAt: true,
      slaFirstResponseDeadline: true,
      slaResolutionDeadline: true,
    },
  });

  for (const conv of warningConvs) {
    const deadline = conv.firstResponseAt
      ? conv.slaResolutionDeadline
      : (conv.slaFirstResponseDeadline ?? conv.slaResolutionDeadline);

    if (!deadline) continue;

    const createdMs = conv.createdAt.getTime();
    const deadlineMs = deadline.getTime();
    const totalDuration = deadlineMs - createdMs;
    const elapsed = now.getTime() - createdMs;
    const percentElapsed = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

    if (percentElapsed >= 80) {
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
          body: `การสนทนา priority ${conv.priority} กำลังจะเกิน SLA ในอีกไม่นาน`,
          link: `/inbox`,
        }).catch(() => {});
      }
    }
  }
}

/**
 * Apply SLA deadlines to a newly created conversation.
 */
export async function applySlaToConversation(
  conversationId: string,
  orgId: string,
  priority: string,
  createdAt: Date
): Promise<void> {
  const config = await prisma.slaConfig.findFirst({
    where: { orgId, priority: priority as "urgent" | "high" | "medium" | "low", isActive: true },
  });

  if (!config) return;

  const { firstResponseDeadline, resolutionDeadline } = computeSlaDeadlines(
    createdAt,
    config.firstResponseMinutes,
    config.resolutionMinutes
  );

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      slaFirstResponseDeadline: firstResponseDeadline,
      slaResolutionDeadline: resolutionDeadline,
    },
  });
}
