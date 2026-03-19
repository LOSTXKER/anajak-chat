import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const intent = await prisma.botIntent.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      messageSet: { select: { id: true, name: true } },
      channel: { select: { id: true, name: true, platform: true } },
    },
  });

  if (!intent) return jsonError("Intent not found", 404);
  return NextResponse.json(intent);
});

export const PUT = apiHandler(async (req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const existing = await prisma.botIntent.findFirst({ where: { id, orgId: user.orgId } });
  if (!existing) return jsonError("Intent not found", 404);

  const body = (await req.json()) as {
    name?: string;
    triggerType?: string;
    keywords?: string[];
    postbackData?: string;
    messageSetId?: string;
    channelId?: string | null;
    priority?: number;
    assignToHuman?: boolean;
    isActive?: boolean;
  };

  if (body.messageSetId) {
    const msExists = await prisma.messageSet.findFirst({
      where: { id: body.messageSetId, orgId: user.orgId },
    });
    if (!msExists) return jsonError("Message set not found", 404);
  }

  const updated = await prisma.botIntent.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.triggerType !== undefined && { triggerType: body.triggerType }),
      ...(body.keywords !== undefined && { keywords: body.keywords }),
      ...(body.postbackData !== undefined && { postbackData: body.postbackData }),
      ...(body.messageSetId !== undefined && { messageSetId: body.messageSetId }),
      ...(body.channelId !== undefined && { channelId: body.channelId }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.assignToHuman !== undefined && { assignToHuman: body.assignToHuman }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: {
      messageSet: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const existing = await prisma.botIntent.findFirst({ where: { id, orgId: user.orgId } });
  if (!existing) return jsonError("Intent not found", 404);

  await prisma.botIntent.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
