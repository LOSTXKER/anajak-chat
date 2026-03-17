import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSync, buildOrderStatusMessage } from "@/lib/erp";
import { sendOrderStatusCapiEvent } from "@/lib/capi-order-events";
import { sendPlatformMessage } from "@/lib/integrations/send-message";
import { validateErpWebhook, isWebhookError } from "@/lib/webhooks/erp-helpers";

const VALID_STATUSES = ["confirmed", "shipped", "delivered", "cancelled"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

export async function POST(request: NextRequest) {
  const ctx = await validateErpWebhook(request);
  if (isWebhookError(ctx)) return ctx;

  const { orgId, payload } = ctx;

  const erpOrderId = payload.orderId as string | undefined;
  const newStatus = payload.status as string | undefined;
  const trackingNumber = (payload.trackingNumber ?? payload.tracking_number ?? "") as string;
  const trackingUrl = (payload.trackingUrl ?? payload.tracking_url ?? "") as string;

  if (!erpOrderId || !newStatus) {
    return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { orgId, erpOrderId },
    include: {
      contact: {
        select: { platformId: true, platform: true, displayName: true },
      },
      conversation: {
        include: {
          channel: {
            select: { platform: true, credentials: true, id: true },
          },
        },
      },
    },
  });

  if (!order) {
    await logSync({
      orgId,
      type: "webhook_order_status",
      direction: "inbound",
      status: "failed",
      entityId: erpOrderId,
      requestPayload: payload,
      errorMessage: `Order not found for erpOrderId=${erpOrderId}`,
    });
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: newStatus as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
    },
  });

  if (VALID_STATUSES.includes(newStatus as ValidStatus)) {
    await sendOrderStatusCapiEvent(order.id, newStatus).catch(() => {});
  }

  const chatMsg = buildOrderStatusMessage(newStatus, {
    order_number: order.orderNumber,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
  });

  if (order.conversation?.channel) {
    const channel = order.conversation.channel;
    try {
      await sendPlatformMessage({
        platform: channel.platform,
        credentials: channel.credentials,
        recipientId: order.contact.platformId,
        text: chatMsg,
      });

      await prisma.message.create({
        data: {
          conversationId: order.conversationId!,
          senderType: "agent",
          senderId: null,
          content: chatMsg,
          contentType: "text",
          platformMessageId: `erp-status-${order.id}-${Date.now()}`,
          metadata: { source: "erp_order_status", status: newStatus },
        },
      });
    } catch {
      // Don't fail webhook if message send fails
    }
  }

  await logSync({
    orgId,
    type: "webhook_order_status",
    direction: "inbound",
    status: "success",
    entityId: erpOrderId,
    requestPayload: payload,
    responsePayload: { orderId: order.id, newStatus, msgSent: !!order.conversation },
  });

  return NextResponse.json({ received: true, orderId: order.id, status: updatedOrder.status });
}
