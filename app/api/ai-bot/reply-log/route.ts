import { NextResponse } from "next/server";
import { requireAuth, searchParams, parsePagination, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import type { AiReplyStatus } from "@/lib/generated/prisma/client";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const { page, limit, skip } = parsePagination(request);
  const sp = searchParams(request);
  const status = sp.get("status") as AiReplyStatus | null;
  const conversationId = sp.get("conversationId");

  const where = {
    orgId: user.orgId,
    ...(status ? { status } : {}),
    ...(conversationId ? { conversationId } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.aiReplyLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        conversation: {
          select: {
            id: true,
            contact: { select: { displayName: true, avatarUrl: true, platform: true } },
          },
        },
      },
    }),
    prisma.aiReplyLog.count({ where }),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({ ...l, confidence: Number(l.confidence) })),
    total,
  });
});
