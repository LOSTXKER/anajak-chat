import { NextResponse } from "next/server";
import { requireAuth, requirePermission, parsePagination, searchParams, jsonError, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { sendOrderCapiEvent } from "@/lib/capi-order-events";
import { getErpConfig, erpFetch, logSync } from "@/lib/erp";
import { ERP_REQUEST_TIMEOUT } from "@/lib/constants";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const sp = searchParams(request);
  const conversationId = sp.get("conversationId");
  const contactId = sp.get("contactId");
  const status = sp.get("status");
  const { limit, skip } = parsePagination(request);

  const orders = await prisma.order.findMany({
    where: {
      orgId: user.orgId,
      ...(conversationId ? { conversationId } : {}),
      ...(contactId ? { contactId } : {}),
      ...(status ? { status: status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" } : {}),
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      contact: { select: { displayName: true, avatarUrl: true, platform: true } },
      conversation: { select: { id: true, sourceAdId: true, sourcePlacement: true } },
    },
  });

  return NextResponse.json(orders);
});

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();
  requirePermission(user, "orders:create");

  const body = await request.json() as {
    conversationId?: string;
    contactId: string;
    amount: number;
    items?: unknown[];
    notes?: string;
  };

  if (!body.contactId || !body.amount) {
    return jsonError("contactId and amount required", 400);
  }

  // Verify contact belongs to org
  const contact = await prisma.contact.findFirst({
    where: { id: body.contactId, orgId: user.orgId },
  });
  if (!contact) return jsonError("Contact not found", 404);

  // Generate order number
  const orderCount = await prisma.order.count({ where: { orgId: user.orgId } });
  const orderNumber = `ORD-${String(orderCount + 1).padStart(5, "0")}`;

  // Get source ad info from conversation if provided
  let sourceAdId: string | null = null;
  let sourcePlacement: string | null = null;
  if (body.conversationId) {
    const conv = await prisma.conversation.findFirst({
      where: { id: body.conversationId, orgId: user.orgId },
      select: { sourceAdId: true, sourcePlacement: true },
    });
    sourceAdId = conv?.sourceAdId ?? null;
    sourcePlacement = conv?.sourcePlacement ?? null;
  }

  const order = await prisma.order.create({
    data: {
      orgId: user.orgId,
      contactId: body.contactId,
      conversationId: body.conversationId ?? null,
      orderNumber,
      amount: body.amount,
      items: (body.items ?? []) as object[],
      sourceAdId,
      sourcePlacement,
      status: "pending",
    },
  });

  // Update contact revenue
  await prisma.contact.update({
    where: { id: body.contactId },
    data: { totalRevenue: { increment: body.amount } },
  });

  // Auto-send CAPI Purchase event
  await sendOrderCapiEvent(order.id, "Purchase").catch(() => {});

  // Push order to ERP if configured
  const erpConfig = getErpConfig(user.organization.settings);
  if (erpConfig?.erpEnabled) {
    const erpPayload = {
      orderNumber: order.orderNumber,
      externalId: order.id,
      amount: Number(order.amount),
      items: body.items ?? [],
      customerId: contact.erpCustomerId ?? null,
      customerName: contact.displayName ?? null,
      source: "anajak_chat",
    };
    try {
      const erpRes = await erpFetch(erpConfig, "/orders", {
        method: "POST",
        body: JSON.stringify(erpPayload),
        signal: AbortSignal.timeout(ERP_REQUEST_TIMEOUT),
      });
      const erpData = await erpRes.json() as { id?: string; orderId?: string };
      const erpOrderId = (erpData.id ?? erpData.orderId ?? "") as string;
      if (erpOrderId) {
        await prisma.order.update({
          where: { id: order.id },
          data: { erpOrderId, erpSyncedAt: new Date() },
        });
      }
      await logSync({
        orgId: user.orgId,
        type: "order_push",
        direction: "outbound",
        status: erpRes.ok ? "success" : "failed",
        entityId: erpOrderId || order.id,
        requestPayload: erpPayload,
        responsePayload: erpData,
        errorMessage: erpRes.ok ? undefined : `ERP returned ${erpRes.status}`,
      });
    } catch (err) {
      await logSync({
        orgId: user.orgId,
        type: "order_push",
        direction: "outbound",
        status: "failed",
        entityId: order.id,
        requestPayload: erpPayload,
        errorMessage: String(err),
      });
    }
  }

  return NextResponse.json(order, { status: 201 });
});
