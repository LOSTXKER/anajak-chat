import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { extractBusinessHours } from "@/lib/business-hours";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const config = extractBusinessHours(user.organization.settings);
  return NextResponse.json(config);
});

export const PUT = apiHandler(async (request) => {
  const user = await requireAuth();
  requirePermission(user, "settings:business_hours");

  const body = await request.json();

  const currentSettings = (user.organization.settings ?? {}) as Record<string, unknown>;
  await prisma.organization.update({
    where: { id: user.orgId },
    data: { settings: { ...currentSettings, businessHours: body } },
  });

  return NextResponse.json({ success: true });
});
