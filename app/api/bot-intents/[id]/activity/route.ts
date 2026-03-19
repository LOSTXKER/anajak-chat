import { NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (_req, ctx) => {
  const user = await requireAuth();
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;

  const sessions = await prisma.intentSession.findMany({
    where: {
      intentId: id,
      intent: { orgId: user.orgId },
    },
    orderBy: { startedAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      sentCount: true,
      totalMessages: true,
      errors: true,
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
