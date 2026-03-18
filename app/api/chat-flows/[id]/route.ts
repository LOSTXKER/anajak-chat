import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const flow = await prisma.chatFlow.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      channel: { select: { id: true, name: true, platform: true } },
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 10,
        select: { id: true, status: true, startedAt: true, completedAt: true, currentStep: true },
      },
    },
  });

  if (!flow) return jsonError("Flow not found", 404);
  return NextResponse.json(flow);
});

export const PUT = apiHandler(async (req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const existing = await prisma.chatFlow.findFirst({ where: { id, orgId: user.orgId } });
  if (!existing) return jsonError("Flow not found", 404);

  const body = (await req.json()) as {
    name?: string;
    description?: string;
    trigger?: unknown;
    steps?: unknown;
    channelId?: string | null;
    priority?: number;
  };

  const updated = await prisma.chatFlow.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.trigger !== undefined && { trigger: body.trigger as object }),
      ...(body.steps !== undefined && { steps: body.steps as object }),
      ...(body.channelId !== undefined && { channelId: body.channelId }),
      ...(body.priority !== undefined && { priority: body.priority }),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const existing = await prisma.chatFlow.findFirst({ where: { id, orgId: user.orgId } });
  if (!existing) return jsonError("Flow not found", 404);

  await prisma.chatFlow.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
