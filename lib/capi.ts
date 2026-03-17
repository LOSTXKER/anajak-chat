import { prisma } from "@/lib/prisma";
import type { CapiEventStatus } from "@/lib/generated/prisma/client";
import { META_GRAPH_BASE_URL } from "@/lib/constants";

const META_GRAPH_URL = META_GRAPH_BASE_URL;

// ─── Dataset Management ──────────────────────────────────────────────────────

export async function createOrFetchDataset(
  channelId: string,
  orgId: string,
  platform: "facebook" | "instagram",
  platformEntityId: string,
  pageAccessToken: string
): Promise<{ datasetId: string; isNew: boolean }> {
  // Check if we already have a dataset for this channel
  const existing = await prisma.capiDataset.findUnique({ where: { channelId } });
  if (existing) return { datasetId: existing.datasetId, isNew: false };

  // Create dataset via Meta Graph API
  const res = await fetch(`${META_GRAPH_URL}/${platformEntityId}/dataset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: pageAccessToken }),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? "Failed to create CAPI dataset");
  }

  const data = await res.json() as { id: string };
  const datasetId = data.id;

  await prisma.capiDataset.create({
    data: {
      orgId,
      channelId,
      datasetId,
      platform,
      platformEntityId,
      isActive: true,
    },
  });

  return { datasetId, isNew: true };
}

// ─── User Data Builder ───────────────────────────────────────────────────────

export function buildUserData(params: {
  platform: string;
  psid?: string | null;
  igsid?: string | null;
  ctwaClid?: string | null;
  pageId?: string | null;
  igBusinessAccountId?: string | null;
  wabId?: string | null;
  phone?: string | null;
  email?: string | null;
}): Record<string, string> {
  const ud: Record<string, string> = {};

  if (params.platform === "facebook" && params.psid) {
    if (params.pageId) ud.page_id = params.pageId;
    ud.page_scoped_user_id = params.psid;
  } else if (params.platform === "instagram" && params.igsid) {
    if (params.igBusinessAccountId)
      ud.instagram_business_account_id = params.igBusinessAccountId;
    ud.ig_sid = params.igsid;
  } else if (params.platform === "whatsapp" && params.ctwaClid) {
    if (params.wabId) ud.whatsapp_business_account_id = params.wabId;
    ud.ctwa_clid = params.ctwaClid;
  }

  // Hashed PII (SHA-256) — send if available for better match
  if (params.phone) {
    ud.ph = params.phone.replace(/\D/g, ""); // normalize; hashing done server-side by Meta
  }
  if (params.email) {
    ud.em = params.email.toLowerCase();
  }

  return ud;
}

// ─── Custom Data Builder ─────────────────────────────────────────────────────

export function buildCustomData(params: {
  eventName: string;
  amount?: number | string | null;
  currency?: string;
  orderId?: string | null;
  orderStatus?: string | null;
  productIds?: string[];
}): Record<string, unknown> {
  const cd: Record<string, unknown> = { currency: params.currency ?? "THB" };

  if (params.amount != null) cd.value = Number(params.amount);
  if (params.orderId) cd.order_id = params.orderId;
  if (params.orderStatus) cd.order_status = params.orderStatus;
  if (params.productIds?.length) cd.content_ids = params.productIds;

  return cd;
}

// ─── Event ID Generator ───────────────────────────────────────────────────────

export function generateEventId(
  orgId: string,
  eventName: string,
  entityId: string
): string {
  const ts = Date.now();
  return `${orgId}_${eventName}_${entityId}_${ts}`;
}

// ─── Send CAPI Event ─────────────────────────────────────────────────────────

interface SendCapiEventParams {
  orgId: string;
  datasetId: string; // CapiDataset.id (our DB id)
  metaDatasetId: string; // the actual Meta dataset ID string
  eventName: string;
  messagingChannel: "messenger" | "instagram" | "whatsapp";
  userData: Record<string, string>;
  customData: Record<string, unknown>;
  pageAccessToken: string;
  conversationId?: string;
  orderId?: string;
}

export async function queueAndSendCapiEvent(
  params: SendCapiEventParams
): Promise<string> {
  const eventId = generateEventId(params.orgId, params.eventName, params.orderId ?? params.conversationId ?? "manual");

  // Dedup check
  const existing = await prisma.capiEvent.findUnique({ where: { eventId } });
  if (existing) return existing.id;

  const record = await prisma.capiEvent.create({
    data: {
      orgId: params.orgId,
      datasetId: params.datasetId,
      eventId,
      eventName: params.eventName,
      messagingChannel: params.messagingChannel,
      userData: params.userData as object,
      customData: params.customData as object,
      status: "pending",
      conversationId: params.conversationId ?? null,
      orderId: params.orderId ?? null,
    },
  });

  // Attempt immediate send
  await attemptSendCapiEvent(record.id, params.metaDatasetId, params.pageAccessToken);

  return record.id;
}

export async function attemptSendCapiEvent(
  capiEventDbId: string,
  metaDatasetId: string,
  pageAccessToken: string
): Promise<boolean> {
  const record = await prisma.capiEvent.findUnique({ where: { id: capiEventDbId } });
  if (!record) return false;

  const eventTime = Math.floor(Date.now() / 1000);

  const payload = {
    data: [
      {
        event_name: record.eventName,
        event_time: eventTime,
        event_id: record.eventId,
        action_source: record.actionSource,
        messaging_channel: record.messagingChannel,
        user_data: record.userData,
        custom_data: record.customData,
      },
    ],
    access_token: pageAccessToken,
  };

  try {
    const res = await fetch(`${META_GRAPH_URL}/${metaDatasetId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await prisma.capiEvent.update({
        where: { id: capiEventDbId },
        data: { status: "sent", sentAt: new Date(), errorMessage: null },
      });
      return true;
    } else {
      const err = await res.json() as { error?: { message?: string } };
      const errMsg = err.error?.message ?? "Unknown Meta API error";
      await prisma.capiEvent.update({
        where: { id: capiEventDbId },
        data: {
          status: "failed",
          errorMessage: errMsg,
          retryCount: { increment: 1 },
        },
      });
      return false;
    }
  } catch (e) {
    await prisma.capiEvent.update({
      where: { id: capiEventDbId },
      data: {
        status: "failed",
        errorMessage: String(e),
        retryCount: { increment: 1 },
      },
    });
    return false;
  }
}

// ─── Retry Failed Events ──────────────────────────────────────────────────────

export async function retryFailedCapiEvents(orgId?: string): Promise<number> {
  const MAX_RETRIES = 3;

  const failedEvents = await prisma.capiEvent.findMany({
    where: {
      ...(orgId ? { orgId } : {}),
      status: { in: ["failed", "retrying"] },
      retryCount: { lt: MAX_RETRIES },
    },
    include: {
      dataset: { select: { datasetId: true, channelId: true } },
    },
    take: 50,
  });

  let retried = 0;
  for (const event of failedEvents) {
    // Get page access token from channel credentials
    const channel = await prisma.channel.findUnique({
      where: { id: event.dataset.channelId },
      select: { credentials: true },
    });
    if (!channel) continue;

    const creds = channel.credentials as Record<string, string>;
    const token = creds.pageAccessToken;
    if (!token) continue;

    await prisma.capiEvent.update({
      where: { id: event.id },
      data: { status: "retrying" },
    });

    await attemptSendCapiEvent(event.id, event.dataset.datasetId, token);
    retried++;
  }

  return retried;
}

// ─── Helper: Get channel CAPI dataset ─────────────────────────────────────────

export async function getActiveDatasetForChannel(channelId: string) {
  return prisma.capiDataset.findUnique({
    where: { channelId },
    select: { id: true, datasetId: true, platform: true, platformEntityId: true },
  });
}

export async function getTokenForChannel(channelId: string): Promise<string | null> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { credentials: true },
  });
  if (!channel) return null;
  const creds = channel.credentials as Record<string, string>;
  return creds.pageAccessToken ?? null;
}
