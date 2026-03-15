import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getErpConfig, verifyErpWebhook, logSync, buildOrderStatusMessage } from "@/lib/erp";
import { sendOrderStatusCapiEvent } from "@/lib/capi-order-events";
import { sendPlatformMessage } from "@/lib/integrations/send-message";

const VALID_STATUSES = ["confirmed", "shipped", "delivered", "cancelled"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-erp-signature");
  const orgId = request.headers.get("x-org-id") ?? request.nextUrl.searchParams.get("orgId");

  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const config = getErpConfig(org.settings);
  if (!config) return NextResponse.json({ error: "ERP not configured" }, { status: 400 });

  if (config.erpWebhookSecret && !verifyErpWebhook(rawBody, signature, config.erpWebhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const erpOrderId = payload.orderId as string | undefined;
  const newStatus = payload.status as string | undefined;
  const trackingNumber = (payload.trackingNumber ?? payload.tracking_number ?? "") as string;
  const trackingUrl = (payload.trackingUrl ?? payload.tracking_url ?? "") as string;

  if (!erpOrderId || !newStatus) {
    return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
  }

  // Find order by erpOrderId
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

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: newStatus as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
    },
  });

  // Auto-send CAPI event for relevant statuses
  if (VALID_STATUSES.includes(newStatus as ValidStatus)) {
    await sendOrderStatusCapiEvent(order.id, newStatus).catch(() => {});
  }

  // Auto-send chat message to customer
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

      // Save the message in DB
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
