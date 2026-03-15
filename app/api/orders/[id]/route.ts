import { NextResponse } from "next/server";
import { requireAuth, requirePermission, jsonError, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusCapiEvent } from "@/lib/capi-order-events";

export const GET = apiHandler(async (_request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const order = await prisma.order.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      contact: { select: { displayName: true, avatarUrl: true, platform: true } },
      conversation: { select: { id: true, sourceAdId: true, sourcePlacement: true } },
    },
  });
  if (!order) return jsonError("Not found", 404);

  return NextResponse.json(order);
});

export const PATCH = apiHandler(async (request, context) => {
  const user = await requireAuth();
  requirePermission(user, "orders:edit");

  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await request.json() as {
    status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
    items?: unknown[];
    amount?: number;
    erpOrderId?: string;
    notes?: string;
  };

  const existing = await prisma.order.findFirst({ where: { id, orgId: user.orgId } });
  if (!existing) return jsonError("Not found", 404);

  const prevStatus = existing.status;

  const updated = await prisma.order.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.items ? { items: body.items as object[] } : {}),
      ...(body.amount != null ? { amount: body.amount } : {}),
      ...(body.erpOrderId ? { erpOrderId: body.erpOrderId } : {}),
    },
  });

  if (body.status && body.status !== prevStatus) {
    await sendOrderStatusCapiEvent(id, body.status).catch(() => {});
  }

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_request, context) => {
  const user = await requireAuth();
  requirePermission(user, "orders:edit");

  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const order = await prisma.order.findFirst({ where: { id, orgId: user.orgId } });
  if (!order) return jsonError("Not found", 404);

  await prisma.order.delete({ where: { id } });

  await prisma.contact.update({
    where: { id: order.contactId },
    data: { totalRevenue: { decrement: Number(order.amount) } },
  }).catch(() => {});

  return NextResponse.json({ success: true });
});
