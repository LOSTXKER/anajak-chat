import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const PATCH = apiHandler(async (_request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId: user.id },
  });
  if (!notification) return jsonError("Not found", 404);

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json(updated);
});
