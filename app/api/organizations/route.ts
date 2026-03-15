import { NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  return NextResponse.json({
    id: user.organization.id,
    name: user.organization.name,
    plan: user.organization.plan,
    settings: user.organization.settings,
  });
});

export const PATCH = apiHandler(async (request) => {
  const user = await requireAuth();

  const body = await request.json();

  const updated = await prisma.organization.update({
    where: { id: user.organization.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.settings !== undefined && { settings: body.settings }),
    },
  });

  return NextResponse.json(updated);
});
