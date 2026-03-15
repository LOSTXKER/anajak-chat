import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const PATCH = apiHandler(async (request, context) => {
  const currentUser = await requireAuth();
  requirePermission(currentUser, "team:invite");

  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await request.json();

  const targetUser = await prisma.user.findFirst({
    where: { id, orgId: currentUser.orgId },
    include: { role: true },
  });

  if (!targetUser) {
    return jsonError("User not found", 404);
  }

  if (targetUser.role.name === "owner" && currentUser.id !== targetUser.id) {
    return jsonError("Cannot modify owner", 403);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.roleId !== undefined && { roleId: body.roleId }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: { role: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
});
