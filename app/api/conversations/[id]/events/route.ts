import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler(async (_request, { params }) => {
  const user = await requireAuth();
  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
    select: { id: true },
  });

  if (!conversation) return jsonError("Not found", 404);

  const events = await prisma.conversationEvent.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(events);
});
