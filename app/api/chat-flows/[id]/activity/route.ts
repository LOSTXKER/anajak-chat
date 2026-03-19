import { NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const sessions = await prisma.flowSession.findMany({
    where: {
      flowId: id,
      flow: { orgId: user.orgId },
    },
    orderBy: { startedAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      conversation: {
        select: {
          id: true,
          contact: { select: { displayName: true, platform: true } },
          channel: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(sessions);
});
