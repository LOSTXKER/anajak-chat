import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const DELETE = apiHandler(async (_request, context) => {
  const user = await requireAuth();
  requirePermission(user, "channels.delete");

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const channel = await prisma.channel.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!channel) return jsonError("Not found", 404);

  const convIds = (await prisma.conversation.findMany({
    where: { channelId: id },
    select: { id: true },
  })).map((c) => c.id);

  if (convIds.length > 0) {
    // Detach orders from conversations before deleting
    await prisma.order.updateMany({
      where: { conversationId: { in: convIds } },
      data: { conversationId: null },
    });
    // Detach capi events from conversations
    await prisma.capiEvent.updateMany({
      where: { conversationId: { in: convIds } },
      data: { conversationId: null },
    });
  }

  await prisma.conversation.deleteMany({ where: { channelId: id } });
  await prisma.channel.delete({ where: { id } });

  return NextResponse.json({ success: true });
});

export const PATCH = apiHandler(async (request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await request.json();

  const channel = await prisma.channel.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!channel) return jsonError("Not found", 404);

  const updated = await prisma.channel.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    select: { id: true, platform: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(updated);
});
