import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const user = await requireAuth();
  requirePermission(user, "analytics:view");

  const agents = await prisma.user.findMany({
    where: { orgId: user.orgId, isActive: true },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      maxConcurrentChats: true,
      role: { select: { name: true } },
      assignedConversations: {
        where: { status: { in: ["open", "pending"] } },
        select: {
          id: true,
          status: true,
          priority: true,
          lastMessageAt: true,
          firstResponseAt: true,
          createdAt: true,
        },
      },
    },
  });

  const workload = agents.map((agent) => {
    const open = agent.assignedConversations.filter((c) => c.status === "open").length;
    const pending = agent.assignedConversations.filter((c) => c.status === "pending").length;
    const total = agent.assignedConversations.length;
    const capacityPercent = Math.round((total / agent.maxConcurrentChats) * 100);

    // Average first response time (ms)
    const respondedConvs = agent.assignedConversations.filter((c) => c.firstResponseAt);
    const avgResponseMs =
      respondedConvs.length > 0
        ? respondedConvs.reduce((sum, c) => {
            return sum + (new Date(c.firstResponseAt!).getTime() - new Date(c.createdAt).getTime());
          }, 0) / respondedConvs.length
        : null;

    return {
      id: agent.id,
      name: agent.name,
      avatarUrl: agent.avatarUrl,
      roleName: agent.role.name,
      maxConcurrentChats: agent.maxConcurrentChats,
      openCount: open,
      pendingCount: pending,
      totalActive: total,
      capacityPercent: Math.min(capacityPercent, 100),
      avgResponseMs,
    };
  });

  // Sort by total active desc
  workload.sort((a, b) => b.totalActive - a.totalActive);

  return NextResponse.json(workload);
});
