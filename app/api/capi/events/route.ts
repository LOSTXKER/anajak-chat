import { NextResponse } from "next/server";
import { requireAuth, requirePermission, parsePagination, searchParams, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const { page, limit, skip } = parsePagination(request);
  const params = searchParams(request);
  const status = params.get("status") ?? undefined;
  const eventName = params.get("eventName") ?? undefined;

  const where = {
    orgId: user.orgId,
    ...(status ? { status: status as "pending" | "sent" | "failed" | "retrying" } : {}),
    ...(eventName ? { eventName } : {}),
  };

  const [events, total] = await Promise.all([
    prisma.capiEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        dataset: { select: { datasetId: true, platform: true } },
      },
    }),
    prisma.capiEvent.count({ where }),
  ]);

  return NextResponse.json({ events, total, page });
});

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();
  requirePermission(user, "capi:manage");

  const body = await request.json() as {
    channelId: string;
    eventName: string;
    conversationId?: string;
    orderId?: string;
    customData?: Record<string, unknown>;
  };

  const { channelId, eventName, conversationId, orderId, customData } = body;
  if (!channelId || !eventName) {
    return jsonError("channelId and eventName required", 400);
  }

  const dataset = await prisma.capiDataset.findFirst({
    where: { channelId, orgId: user.orgId, isActive: true },
  });
  if (!dataset) {
    return jsonError("No active CAPI dataset for this channel", 400);
  }

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { credentials: true, platform: true },
  });
  if (!channel) return jsonError("Channel not found", 404);

  const creds = channel.credentials as Record<string, string>;

  // Build user data from conversation if provided
  let userData: Record<string, string> = {};
  if (conversationId) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, orgId: user.orgId },
      include: { contact: { select: { platformId: true, phone: true, email: true } } },
    });
    if (conv) {
      if (channel.platform === "facebook") {
        if (creds.pageId) userData.page_id = creds.pageId;
        userData.page_scoped_user_id = conv.contact.platformId;
      } else if (channel.platform === "instagram") {
        if (creds.pageId) userData.instagram_business_account_id = creds.pageId;
        userData.ig_sid = conv.contact.platformId;
      }
      if (conv.contact.phone) userData.ph = conv.contact.phone.replace(/\D/g, "");
      if (conv.contact.email) userData.em = conv.contact.email.toLowerCase();
    }
  }

  const { queueAndSendCapiEvent } = await import("@/lib/capi");
  const eventDbId = await queueAndSendCapiEvent({
    orgId: user.orgId,
    datasetId: dataset.id,
    metaDatasetId: dataset.datasetId,
    eventName,
    messagingChannel: channel.platform as "messenger" | "instagram" | "whatsapp",
    userData,
    customData: customData ?? {},
    pageAccessToken: creds.pageAccessToken,
    conversationId: conversationId ?? undefined,
    orderId: orderId ?? undefined,
  });

  return NextResponse.json({ id: eventDbId });
});
