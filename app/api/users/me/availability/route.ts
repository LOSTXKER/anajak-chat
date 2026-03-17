import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-helpers";

export const PATCH = apiHandler(async (request) => {
  const user = await requireAuth();
  const body = await request.json();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isAvailable: body.isAvailable },
    select: { id: true, isAvailable: true },
  });

  return NextResponse.json(updated);
});

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, isAvailable: true },
  });

  return NextResponse.json(me);
});
