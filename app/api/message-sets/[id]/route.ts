import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const set = await prisma.messageSet.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      intents: { select: { id: true, name: true, isActive: true } },
    },
  });

  if (!set) return jsonError("Message set not found", 404);
  return NextResponse.json(set);
});

export const PUT = apiHandler(async (req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const existing = await prisma.messageSet.findFirst({ where: { id, orgId: user.orgId } });
  if (!existing) return jsonError("Message set not found", 404);

  const body = (await req.json()) as {
    name?: string;
    messages?: unknown;
  };

  const updated = await prisma.messageSet.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.messages !== undefined && { messages: body.messages as object }),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const existing = await prisma.messageSet.findFirst({
    where: { id, orgId: user.orgId },
    include: { _count: { select: { intents: true } } },
  });
  if (!existing) return jsonError("Message set not found", 404);

  if (existing._count.intents > 0) {
    return jsonError("Cannot delete: message set is linked to intents", 400);
  }

  await prisma.messageSet.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
