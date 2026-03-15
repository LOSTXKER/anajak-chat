import { NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const channels = await prisma.channel.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      platform: true,
      name: true,
      isActive: true,
      createdAt: true,
      // exclude credentials for security
    },
  });

  return NextResponse.json(channels);
});
