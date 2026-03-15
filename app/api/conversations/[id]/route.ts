import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler(async (_request, context) => {
  const user = await requireAuth();
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      contact: true,
      channel: { select: { id: true, platform: true, name: true } },
      assignedUser: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  if (!conversation) return jsonError("Not found", 404);

  return NextResponse.json(conversation);
});

export const PATCH = apiHandler(async (request, context) => {
  const user = await requireAuth();
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const body = await request.json();

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!conversation) return jsonError("Not found", 404);

  const updated = await prisma.conversation.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.status === "resolved" && !conversation.resolvedAt && { resolvedAt: new Date() }),
    },
    include: {
      contact: true,
      channel: { select: { id: true, platform: true, name: true } },
      assignedUser: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(updated);
});
