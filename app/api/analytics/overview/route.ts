import { NextResponse } from "next/server";
import { requireAuth, parseDaysParam, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const days = parseDaysParam(request);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    totalConversations,
    openConversations,
    resolvedConversations,
    totalContacts,
    revenueResult,
    firstResponses,
    slaBreaches,
  ] = await Promise.all([
    prisma.conversation.count({ where: { orgId: user.orgId, createdAt: { gte: since } } }),
    prisma.conversation.count({ where: { orgId: user.orgId, status: "open" } }),
    prisma.conversation.count({ where: { orgId: user.orgId, status: "resolved", resolvedAt: { gte: since } } }),
    prisma.contact.count({ where: { orgId: user.orgId } }),
    prisma.order.aggregate({
      where: { orgId: user.orgId, createdAt: { gte: since } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.conversation.findMany({
      where: {
        orgId: user.orgId,
        createdAt: { gte: since },
        firstResponseAt: { not: null },
      },
      select: { lastMessageAt: true, firstResponseAt: true },
    }),
    prisma.conversation.count({
      where: {
        orgId: user.orgId,
        slaBreachedAt: { not: null, gte: since },
      },
    }),
  ]);

  // Avg first response time in minutes
  const avgFirstResponseMinutes =
    firstResponses.length > 0
      ? firstResponses.reduce((acc, c) => {
          const base = c.lastMessageAt ?? c.firstResponseAt!;
          const diff = (c.firstResponseAt!.getTime() - base.getTime()) / 60000;
          return acc + diff;
        }, 0) / firstResponses.length
      : null;

  const resolveRate =
    totalConversations > 0 ? Math.round((resolvedConversations / totalConversations) * 100) : 0;

  return NextResponse.json({
    totalConversations,
    openConversations,
    resolvedConversations,
    resolveRate,
    totalContacts,
    totalOrders: revenueResult._count,
    totalRevenue: Number(revenueResult._sum.amount ?? 0),
    avgFirstResponseMinutes: avgFirstResponseMinutes
      ? Math.round(avgFirstResponseMinutes)
      : null,
    slaBreaches,
  });
});
