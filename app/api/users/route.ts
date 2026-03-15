import { NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const users = await prisma.user.findMany({
    where: { orgId: user.orgId },
    include: { role: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
});
