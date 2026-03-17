import { prisma } from "@/lib/prisma";
import {
  buildUserData,
  queueAndSendCapiEvent,
  getActiveDatasetForChannel,
  getTokenForChannel,
} from "@/lib/capi";
import type { Platform } from "@/lib/generated/prisma/client";

// Simple regexes for phone/email detection in messages
const PHONE_RE = /(?:\+66|0)[6-9]\d{8}|(?:\+66|0)[2-5]\d{7}/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

interface LeadEventParams {
  orgId: string;
  conversationId: string;
  channelId: string;
  platform: Platform;
  contactPlatformId: string;
  messageContent: string;
}

export async function maybeQueueLeadCapiEvent(params: LeadEventParams): Promise<void> {
  // Only fire if message contains phone or email
  const hasPhone = PHONE_RE.test(params.messageContent);
  const hasEmail = EMAIL_RE.test(params.messageContent);
  if (!hasPhone && !hasEmail) return;

  // Only send if the conversation has ad attribution
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
    select: { sourceAdId: true },
  });
  if (!conversation?.sourceAdId) return;

  const dataset = await getActiveDatasetForChannel(params.channelId);
  if (!dataset) return;

  const token = await getTokenForChannel(params.channelId);
  if (!token) return;

  // Check dedup: did we already send LeadSubmitted for this conversation?
  const existingLead = await prisma.capiEvent.findFirst({
    where: {
      conversationId: params.conversationId,
      eventName: "LeadSubmitted",
      status: { in: ["sent", "pending", "retrying"] },
    },
  });
  if (existingLead) return;

  const contact = await prisma.contact.findFirst({
    where: { orgId: params.orgId, platformId: params.contactPlatformId },
    select: { phone: true, email: true },
  });

  const channel = await prisma.channel.findUnique({
    where: { id: params.channelId },
    select: { credentials: true },
  });
  const creds = (channel?.credentials ?? {}) as Record<string, string>;

  const userData = buildUserData({
    platform: params.platform,
    psid: params.platform === "facebook" ? params.contactPlatformId : undefined,
    igsid: params.platform === "instagram" ? params.contactPlatformId : undefined,
    pageId: creds.pageId,
    igBusinessAccountId: creds.pageId,
    phone: contact?.phone ?? (hasPhone ? PHONE_RE.exec(params.messageContent)?.[0] : undefined),
    email: contact?.email ?? (hasEmail ? EMAIL_RE.exec(params.messageContent)?.[0] : undefined),
  });

  await queueAndSendCapiEvent({
    orgId: params.orgId,
    datasetId: dataset.id,
    metaDatasetId: dataset.datasetId,
    eventName: "LeadSubmitted",
    messagingChannel: params.platform === "instagram" ? "instagram" : "messenger",
    userData,
    customData: { lead_type: hasPhone ? "phone" : "email" },
    pageAccessToken: token,
    conversationId: params.conversationId,
  }).catch((e) => console.error("[CAPI] lead event error:", e));
}
