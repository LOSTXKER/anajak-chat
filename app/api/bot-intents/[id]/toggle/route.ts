import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const PATCH = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const existing = await prisma.botIntent.findFirst({ where: { id, orgId: user.orgId } });
  if (!existing) return jsonError("Intent not found", 404);

  const updated = await prisma.botIntent.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  return NextResponse.json(updated);
});
