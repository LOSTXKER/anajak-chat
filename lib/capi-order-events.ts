/**
 * Helper to auto-send CAPI events when orders are created or status changes.
 * Checks whether the conversation has ad attribution before sending.
 */
import { prisma } from "@/lib/prisma";
import {
  buildUserData,
  buildCustomData,
  queueAndSendCapiEvent,
  getActiveDatasetForChannel,
  getTokenForChannel,
} from "@/lib/capi";

const STATUS_TO_EVENT: Record<string, string> = {
  confirmed: "OrderCreated",
  shipped: "OrderShipped",
  delivered: "OrderDelivered",
  cancelled: "OrderCanceled",
};

export async function sendOrderCapiEvent(
  orderId: string,
  eventName: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      conversation: {
        select: {
          id: true,
          channelId: true,
          sourceAdId: true,
          sourcePlacement: true,
          contact: {
            select: { platformId: true, phone: true, email: true, platform: true },
          },
          channel: {
            select: { platform: true, credentials: true },
          },
        },
      },
      contact: { select: { platformId: true, phone: true, email: true, platform: true } },
    },
  });

  if (!order) return;

  const conversation = order.conversation;
  const channelId = conversation?.channelId;
  const platform = conversation?.channel?.platform ?? order.contact.platform;

  // Only send if we have a channel and (for CAPI purposes) ideally an ad source
  if (!channelId) return;

  const dataset = await getActiveDatasetForChannel(channelId);
  if (!dataset || !dataset) return;

  const token = await getTokenForChannel(channelId);
  if (!token) return;

  const creds = (conversation?.channel?.credentials ?? {}) as Record<string, string>;
  const contact = conversation?.contact ?? order.contact;

  const userData = buildUserData({
    platform,
    psid: platform === "facebook" ? contact.platformId : undefined,
    igsid: platform === "instagram" ? contact.platformId : undefined,
    pageId: creds.pageId,
    igBusinessAccountId: creds.pageId,
    phone: contact.phone,
    email: contact.email,
  });

  const customData = buildCustomData({
    eventName,
    amount: Number(order.amount),
    currency: "THB",
    orderId: order.orderNumber,
    orderStatus: order.status,
  });

  await queueAndSendCapiEvent({
    orgId: order.orgId,
    datasetId: dataset.id,
    metaDatasetId: dataset.datasetId,
    eventName,
    messagingChannel: platform === "instagram" ? "instagram" : "messenger",
    userData,
    customData,
    pageAccessToken: token,
    conversationId: conversation?.id,
    orderId: order.id,
  }).catch(() => {});
}

export async function sendOrderStatusCapiEvent(
  orderId: string,
  newStatus: string
): Promise<void> {
  const eventName = STATUS_TO_EVENT[newStatus];
  if (!eventName) return;
  await sendOrderCapiEvent(orderId, eventName).catch(() => {});
}
