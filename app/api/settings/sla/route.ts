import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const DEFAULT_SLA = [
  { priority: "urgent", firstResponseMinutes: 2, resolutionMinutes: 30 },
  { priority: "high", firstResponseMinutes: 5, resolutionMinutes: 60 },
  { priority: "medium", firstResponseMinutes: 15, resolutionMinutes: 240 },
  { priority: "low", firstResponseMinutes: 60, resolutionMinutes: 1440 },
] as const;

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const configs = await prisma.slaConfig.findMany({
    where: { orgId: user.orgId },
    orderBy: { priority: "asc" },
  });

  // Return defaults if no configs exist yet
  if (configs.length === 0) {
    return NextResponse.json(
      DEFAULT_SLA.map((d) => ({
        ...d,
        id: null,
        orgId: user.orgId,
        isActive: true,
        escalateTo: null,
        createdAt: null,
        updatedAt: null,
      }))
    );
  }

  return NextResponse.json(configs);
});

export const PUT = apiHandler(async (request) => {
  const user = await requireAuth();
  requirePermission(user, "settings:sla");

  const body = await request.json() as Array<{
    priority: "urgent" | "high" | "medium" | "low";
    firstResponseMinutes: number;
    resolutionMinutes: number;
    isActive: boolean;
    escalateTo?: string | null;
  }>;

  for (const item of body) {
    await prisma.slaConfig.upsert({
      where: {
        orgId_priority: {
          orgId: user.orgId,
          priority: item.priority,
        },
      },
      create: {
        orgId: user.orgId,
        priority: item.priority,
        firstResponseMinutes: item.firstResponseMinutes,
        resolutionMinutes: item.resolutionMinutes,
        isActive: item.isActive ?? true,
        escalateTo: item.escalateTo ?? null,
      },
      update: {
        firstResponseMinutes: item.firstResponseMinutes,
        resolutionMinutes: item.resolutionMinutes,
        isActive: item.isActive ?? true,
        escalateTo: item.escalateTo ?? null,
      },
    });
  }

  return NextResponse.json({ success: true });
});
