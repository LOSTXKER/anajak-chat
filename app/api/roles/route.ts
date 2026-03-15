import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const roles = await prisma.role.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(roles);
});

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();
  requirePermission(user, "settings:edit");

  const { name, description, permissions: rolePermissions } =
    await request.json();

  if (!name) {
    return jsonError("Role name is required", 400);
  }

  const role = await prisma.role.create({
    data: {
      orgId: user.orgId,
      name,
      description: description || null,
      permissions: rolePermissions || [],
      isSystemRole: false,
    },
  });

  return NextResponse.json(role, { status: 201 });
});
