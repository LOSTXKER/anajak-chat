import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const DELETE = apiHandler(async (_request, context) => {
  const user = await requireAuth();
  requirePermission(user, "capi:manage");

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const dataset = await prisma.capiDataset.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!dataset) return jsonError("Not found", 404);

  // Soft delete: set isActive = false
  await prisma.capiDataset.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
});

export const PATCH = apiHandler(async (request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await request.json() as { isActive?: boolean };

  const dataset = await prisma.capiDataset.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!dataset) return jsonError("Not found", 404);

  const updated = await prisma.capiDataset.update({
    where: { id },
    data: { isActive: body.isActive ?? dataset.isActive },
  });

  return NextResponse.json(updated);
});
