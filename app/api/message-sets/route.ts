import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const sets = await prisma.messageSet.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { intents: true } },
    },
  });

  return NextResponse.json(sets);
});

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const body = (await req.json()) as {
    name: string;
    messages?: unknown;
  };

  if (!body.name?.trim()) return jsonError("name is required", 400);

  const set = await prisma.messageSet.create({
    data: {
      orgId: user.orgId,
      name: body.name.trim(),
      messages: (body.messages as object) ?? {},
      createdBy: user.id,
    },
  });

  return NextResponse.json(set, { status: 201 });
});
