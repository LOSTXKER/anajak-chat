import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler, jsonError } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const POST = apiHandler(async (request) => {
  const currentUser = await requireAuth();
  requirePermission(currentUser, "team:invite");

  const { name, email, password, roleId } = await request.json();

  if (!name || !email || !password || !roleId) {
    return jsonError("All fields are required", 400);
  }

  const role = await prisma.role.findFirst({
    where: { id: roleId, orgId: currentUser.orgId },
  });

  if (!role) {
    return jsonError("Role not found", 400);
  }

  if (role.name === "owner") {
    return jsonError("Cannot assign owner role", 400);
  }

  const supabase = await createServiceClient();

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

  if (authError) {
    return jsonError(authError.message, 400);
  }

  await prisma.user.create({
    data: {
      id: authData.user.id,
      orgId: currentUser.orgId,
      email,
      name,
      roleId,
    },
  });

  return NextResponse.json({ success: true });
});
