import { NextResponse } from "next/server";
import { requireAuth, parseDaysParam, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const days = parseDaysParam(request);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const agents = await prisma.user.findMany({
    where: { orgId: user.orgId },
    select: {
      id: true,
      name: true,
      email: true,
      assignedConversations: {
        where: { createdAt: { gte: since } },
        select: {
          id: true,
          status: true,
          firstResponseAt: true,
          lastMessageAt: true,
          createdAt: true,
          resolvedAt: true,
          slaBreachedAt: true,
        },
      },
    },
  });

  const result = agents.map((agent) => {
    const convs = agent.assignedConversations;
    const open = convs.filter((c) => c.status === "open" || c.status === "pending").length;
    const resolved = convs.filter((c) => c.status === "resolved").length;
    const withResponse = convs.filter((c) => c.firstResponseAt);
    const avgResponseMin =
      withResponse.length > 0
        ? Math.round(
            withResponse.reduce((acc, c) => {
              const base = c.lastMessageAt ?? c.createdAt;
              return acc + (c.firstResponseAt!.getTime() - base.getTime()) / 60000;
            }, 0) / withResponse.length
          )
        : null;
    const slaBreached = convs.filter((c) => c.slaBreachedAt).length;
    const slaCompliance =
      convs.length > 0 ? Math.round(((convs.length - slaBreached) / convs.length) * 100) : 100;

    return {
      id: agent.id,
      name: agent.name,
      email: agent.email,
      totalConversations: convs.length,
      openConversations: open,
      resolvedConversations: resolved,
      avgFirstResponseMinutes: avgResponseMin,
      slaBreached,
      slaCompliance,
    };
  });

  return NextResponse.json({ agents: result });
});
