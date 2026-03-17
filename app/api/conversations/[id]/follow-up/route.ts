import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-helpers";

export const POST = apiHandler(async (_request, { params }) => {
  const user = await requireAuth();
  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.conversation.update({
    where: { id },
    data: { status: "follow_up" },
  });

  await prisma.conversationEvent.create({
    data: {
      conversationId: id,
      eventType: "follow_up",
      actorId: user.id,
      metadata: { agentName: user.name },
    },
  });

  return NextResponse.json({ status: "follow_up" });
});
