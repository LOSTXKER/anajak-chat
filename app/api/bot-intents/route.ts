import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const intents = await prisma.botIntent.findMany({
    where: { orgId: user.orgId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      messageSet: { select: { id: true, name: true } },
      channel: { select: { id: true, name: true, platform: true } },
      _count: { select: { sessions: true } },
    },
  });

  return NextResponse.json(intents);
});

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const body = (await req.json()) as {
    name: string;
    triggerType: string;
    keywords?: string[];
    postbackData?: string;
    messageSetId: string;
    channelId?: string;
    priority?: number;
    assignToHuman?: boolean;
  };

  if (!body.name?.trim()) return jsonError("name is required", 400);
  if (!body.triggerType) return jsonError("triggerType is required", 400);
  if (!body.messageSetId) return jsonError("messageSetId is required", 400);

  const msExists = await prisma.messageSet.findFirst({
    where: { id: body.messageSetId, orgId: user.orgId },
  });
  if (!msExists) return jsonError("Message set not found", 404);

  const intent = await prisma.botIntent.create({
    data: {
      orgId: user.orgId,
      name: body.name.trim(),
      triggerType: body.triggerType,
      keywords: body.keywords ?? [],
      postbackData: body.postbackData ?? null,
      messageSetId: body.messageSetId,
      channelId: body.channelId ?? null,
      priority: body.priority ?? 0,
      assignToHuman: body.assignToHuman ?? false,
      createdBy: user.id,
    },
    include: {
      messageSet: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(intent, { status: 201 });
});
