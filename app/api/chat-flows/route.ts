import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const flows = await prisma.chatFlow.findMany({
    where: { orgId: user.orgId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      channel: { select: { id: true, name: true, platform: true } },
      _count: { select: { sessions: true } },
    },
  });

  return NextResponse.json(flows);
});

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const body = (await req.json()) as {
    name: string;
    description?: string;
    trigger: unknown;
    steps: unknown;
    channelId?: string;
    priority?: number;
  };

  if (!body.name || !body.trigger) return jsonError("name and trigger required", 400);

  const flow = await prisma.chatFlow.create({
    data: {
      orgId: user.orgId,
      name: body.name,
      description: body.description ?? null,
      trigger: body.trigger as object,
      steps: (body.steps as object) ?? [],
      channelId: body.channelId ?? null,
      priority: body.priority ?? 0,
      createdBy: user.id,
    },
  });

  return NextResponse.json(flow, { status: 201 });
});
