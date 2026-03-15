import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { attemptSendCapiEvent } from "@/lib/capi";

export const POST = apiHandler(async (_request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const event = await prisma.capiEvent.findFirst({
    where: { id, orgId: user.orgId },
    include: { dataset: { select: { datasetId: true, channelId: true } } },
  });
  if (!event) return jsonError("Not found", 404);

  const channel = await prisma.channel.findUnique({
    where: { id: event.dataset.channelId },
    select: { credentials: true },
  });
  if (!channel) return jsonError("Channel not found", 404);

  const creds = channel.credentials as Record<string, string>;

  await prisma.capiEvent.update({
    where: { id },
    data: { status: "retrying" },
  });

  const success = await attemptSendCapiEvent(id, event.dataset.datasetId, creds.pageAccessToken);
  return NextResponse.json({ success });
});
