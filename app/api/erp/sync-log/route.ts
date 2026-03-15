import { NextResponse } from "next/server";
import { requireAuth, parsePagination, searchParams, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import type { SyncLogType, SyncLogStatus } from "@/lib/generated/prisma/client";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const { page, limit, skip } = parsePagination(request, { limit: 15 });
  const params = searchParams(request);
  const type = params.get("type") as SyncLogType | null;
  const status = params.get("status") as SyncLogStatus | null;

  const where = {
    orgId: user.orgId,
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.syncLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        direction: true,
        status: true,
        entityId: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
    prisma.syncLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total });
});
