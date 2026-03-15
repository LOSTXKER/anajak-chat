import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

type AssignmentStrategy = "round_robin" | "load_balance";

/**
 * Auto-assign a conversation to an available agent.
 * Strategy is read from org settings, defaults to load_balance.
 */
export async function autoAssignConversation(
  conversationId: string,
  orgId: string
): Promise<string | null> {
  // Fetch org settings for strategy preference
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { settings: true },
  });

  const settings = (org?.settings ?? {}) as Record<string, unknown>;
  const strategy: AssignmentStrategy =
    (settings.assignmentStrategy as AssignmentStrategy) ?? "load_balance";

  // Get agents with base permission (role that has chat:view_assigned or *)
  const agents = await prisma.user.findMany({
    where: {
      orgId,
      isActive: true,
      role: {
        OR: [
          { permissions: { array_contains: "chat:view_assigned" } },
          { permissions: { array_contains: "*" } },
          { permissions: { array_contains: "chat:assign" } },
        ],
      },
    },
    select: {
      id: true,
      maxConcurrentChats: true,
      _count: {
        select: {
          assignedConversations: {
            where: { status: { in: ["open", "pending"] } },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (agents.length === 0) return null;

  // Filter agents under their max capacity
  const available = agents.filter(
    (a) => a._count.assignedConversations < a.maxConcurrentChats
  );

  if (available.length === 0) return null;

  let targetAgentId: string;

  if (strategy === "round_robin") {
    // Round robin: use last assignment counter stored in org settings
    const lastIndex = typeof settings.rrIndex === "number" ? settings.rrIndex : -1;
    const nextIndex = (lastIndex + 1) % available.length;
    targetAgentId = available[nextIndex].id;
    // Update the round robin index
    await prisma.organization.update({
      where: { id: orgId },
      data: { settings: { ...(settings as object), rrIndex: nextIndex } },
    });
  } else {
    // Load balance: pick agent with fewest open conversations
    available.sort(
      (a, b) =>
        a._count.assignedConversations - b._count.assignedConversations
    );
    targetAgentId = available[0].id;
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { assignedTo: targetAgentId },
  });

  await prisma.conversationEvent.create({
    data: {
      conversationId,
      eventType: "auto_assigned",
      metadata: { agentId: targetAgentId, strategy },
    },
  });

  await createNotification({
    orgId,
    userId: targetAgentId,
    type: "assignment",
    title: "แชทใหม่ถูกมอบหมายให้คุณ",
    body: "มีการสนทนาใหม่ที่ระบบมอบหมายให้คุณโดยอัตโนมัติ",
    link: `/inbox`,
  });

  return targetAgentId;
}
