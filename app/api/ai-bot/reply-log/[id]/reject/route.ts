import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const POST = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const log = await prisma.aiReplyLog.findFirst({
    where: { id, orgId: user.orgId, status: "pending_review" },
  });
  if (!log) return jsonError("Not found or not pending", 404);

  await prisma.aiReplyLog.update({
    where: { id },
    data: { status: "rejected", reviewedBy: user.id, reviewedAt: new Date() },
  });

  return NextResponse.json({ success: true });
});
