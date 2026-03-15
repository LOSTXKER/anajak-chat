import { NextResponse } from "next/server";
import { requireAuth, jsonError, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const PUT = apiHandler(async (request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await request.json();

  const template = await prisma.quickReplyTemplate.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!template) return jsonError("Not found", 404);

  const updated = await prisma.quickReplyTemplate.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.shortcut !== undefined && { shortcut: body.shortcut }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const template = await prisma.quickReplyTemplate.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!template) return jsonError("Not found", 404);

  await prisma.quickReplyTemplate.delete({ where: { id } });

  return NextResponse.json({ success: true });
});

export const POST = apiHandler(async (_request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  await prisma.quickReplyTemplate.updateMany({
    where: { id, orgId: user.orgId },
    data: { usageCount: { increment: 1 } },
  });

  return NextResponse.json({ success: true });
});
