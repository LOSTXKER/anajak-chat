import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const POST = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const flow = await prisma.chatFlow.findFirst({ where: { id, orgId: user.orgId } });
  if (!flow) return jsonError("Flow not found", 404);

  const updated = await prisma.chatFlow.update({
    where: { id },
    data: { isActive: !flow.isActive },
  });

  return NextResponse.json({ isActive: updated.isActive });
});
