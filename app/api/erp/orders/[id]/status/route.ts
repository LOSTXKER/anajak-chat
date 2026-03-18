import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getErpConfig, erpFetch, logSync } from "@/lib/erp";
import { sendOrderStatusCapiEvent } from "@/lib/capi-order-events";
import { ERP_REQUEST_TIMEOUT } from "@/lib/constants";

export const GET = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  requirePermission(user, "orders:view");
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const order = await prisma.order.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!order) return jsonError("Order not found", 404);
  if (!order.erpOrderId) return jsonError("Order has no ERP link", 400);

  const erpConfig = getErpConfig(user.organization.settings);
  if (!erpConfig?.erpEnabled) return jsonError("ERP not configured", 400);

  let erpStatus: string;
  try {
    const res = await erpFetch(erpConfig, `/orders/${order.erpOrderId}`, {
      signal: AbortSignal.timeout(ERP_REQUEST_TIMEOUT),
    });
    if (!res.ok) {
      return jsonError(`ERP returned ${res.status}`, 502);
    }
    const data = (await res.json()) as { status?: string };
    erpStatus = data.status ?? "unknown";
  } catch {
    return jsonError("ERP connection failed", 502);
  }

  const localStatus = order.status;
  let synced = false;

  if (erpStatus !== localStatus && erpStatus !== "unknown") {
    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (validStatuses.includes(erpStatus)) {
      await prisma.order.update({
        where: { id },
        data: { status: erpStatus as typeof order.status },
      });

      await logSync({
        orgId: user.orgId,
        type: "webhook_order_status",
        direction: "inbound",
        status: "success",
        entityId: order.erpOrderId,
        requestPayload: { erpStatus, localStatus },
      });

      await sendOrderStatusCapiEvent(id, erpStatus).catch(() => {});
      synced = true;
    }
  }

  return NextResponse.json({ erpStatus, localStatus, synced });
});
