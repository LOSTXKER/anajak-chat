import { NextResponse } from "next/server";
import { requireAuth, jsonError, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const DELETE = apiHandler(async (_request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const note = await prisma.note.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!note) return jsonError("Not found", 404);

  // Only author can delete their own notes (unless admin)
  const permissions = user.role.permissions as string[];
  const isAdmin = permissions.includes("*");
  if (note.authorId !== user.id && !isAdmin) {
    return jsonError("Forbidden", 403);
  }

  await prisma.note.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
