import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { createOrFetchDataset } from "@/lib/capi";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const datasets = await prisma.capiDataset.findMany({
    where: { orgId: user.orgId },
    include: {
      channel: { select: { id: true, platform: true, name: true } },
      _count: { select: { capiEvents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(datasets);
});

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();
  requirePermission(user, "capi:manage");

  const { channelId } = await request.json() as { channelId: string };
  if (!channelId) return jsonError("channelId required", 400);

  const channel = await prisma.channel.findFirst({
    where: { id: channelId, orgId: user.orgId },
    select: { id: true, platform: true, credentials: true },
  });
  if (!channel) return jsonError("Channel not found", 404);

  if (!["facebook", "instagram"].includes(channel.platform)) {
    return jsonError("CAPI is only supported for Facebook and Instagram channels", 400);
  }

  const creds = channel.credentials as Record<string, string>;
  const pageAccessToken = creds.pageAccessToken;
  const pageId = creds.pageId;

  if (!pageAccessToken || !pageId) {
    return jsonError("Channel credentials incomplete", 400);
  }

  try {
    const { datasetId, isNew } = await createOrFetchDataset(
      channelId,
      user.orgId,
      channel.platform as "facebook" | "instagram",
      pageId,
      pageAccessToken
    );

    const dataset = await prisma.capiDataset.findUnique({
      where: { channelId },
      include: {
        channel: { select: { id: true, platform: true, name: true } },
        _count: { select: { capiEvents: true } },
      },
    });

    return NextResponse.json({ ...dataset, isNew });
  } catch (err) {
    return jsonError(String(err), 500);
  }
});
