import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const now = new Date();

  const conversations = await prisma.conversation.findMany({
    where: {
      orgId: user.orgId,
      status: { in: ["open", "pending"] },
      OR: [
        { slaBreachedAt: { not: null } },
        { slaFirstResponseDeadline: { lte: new Date(now.getTime() + 20 * 60 * 1000) } },
        { slaResolutionDeadline: { lte: new Date(now.getTime() + 20 * 60 * 1000) } },
      ],
    },
    orderBy: { slaFirstResponseDeadline: "asc" },
    take: 20,
    include: {
      contact: {
        select: { displayName: true, avatarUrl: true, platform: true },
      },
      channel: { select: { platform: true, name: true } },
    },
  });

  return NextResponse.json(conversations);
});
