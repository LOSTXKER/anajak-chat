import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const PATCH = apiHandler(async (request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const { name, parentId } = await request.json();

  const folder = await prisma.mediaFolder.findFirst({ where: { id, orgId: user.orgId } });
  if (!folder) return jsonError("Not found", 404);

  const updated = await prisma.mediaFolder.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(parentId !== undefined && { parentId }),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const folder = await prisma.mediaFolder.findFirst({ where: { id, orgId: user.orgId } });
  if (!folder) return jsonError("Not found", 404);

  await prisma.mediaFolder.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
