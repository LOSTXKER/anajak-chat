import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { applySlaToPendingConversations } from "@/lib/sla";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const configs = await prisma.slaConfig.findMany({
    where: { orgId: user.orgId },
    orderBy: { priority: "asc" },
  });

  if (configs.length === 0) {
    return NextResponse.json([
      {
        id: null,
        orgId: user.orgId,
        priority: "medium",
        firstResponseMinutes: 15,
        resolutionMinutes: 0,
        isActive: true,
        escalateTo: null,
        createdAt: null,
        updatedAt: null,
      },
    ]);
  }

  return NextResponse.json(configs);
});

export const PUT = apiHandler(async (request) => {
  const user = await requireAuth();
  requirePermission(user, "settings:sla");

  const body = await request.json() as Array<{
    priority: "urgent" | "high" | "medium" | "low";
    firstResponseMinutes: number;
    isActive: boolean;
    escalateTo?: string | null;
  }>;

  let appliedCount = 0;

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
        resolutionMinutes: 0,
        isActive: item.isActive ?? true,
        escalateTo: item.escalateTo ?? null,
      },
      update: {
        firstResponseMinutes: item.firstResponseMinutes,
        resolutionMinutes: 0,
        isActive: item.isActive ?? true,
        escalateTo: item.escalateTo ?? null,
      },
    });

    if (item.isActive && item.priority === "medium") {
      appliedCount = await applySlaToPendingConversations(
        user.orgId,
        item.firstResponseMinutes
      );
    }
  }

  return NextResponse.json({ success: true, appliedCount });
});
