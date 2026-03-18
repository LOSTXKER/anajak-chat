import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const { orderedIds } = (await req.json()) as { orderedIds: string[] };

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return jsonError("orderedIds array required", 400);
  }

  const updates = orderedIds.map((id, index) =>
    prisma.chatFlow.updateMany({
      where: { id, orgId: user.orgId },
      data: { priority: orderedIds.length - index },
    })
  );

  await prisma.$transaction(updates);

  return NextResponse.json({ success: true });
});
