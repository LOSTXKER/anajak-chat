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

  const startable = ["pending", "resolved"];
  if (!startable.includes(conversation.status)) {
    return NextResponse.json({ error: "Cannot start from current status" }, { status: 400 });
  }

  const updated = await prisma.conversation.update({
    where: { id },
    data: {
      status: "open",
      assignedTo: user.id,
      labels: [],
      startedAt: new Date(),
      firstResponseAt: null,
    },
    include: {
      assignedUser: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  await prisma.conversationEvent.create({
    data: {
      conversationId: id,
      eventType: "session_started",
      actorId: user.id,
      metadata: { agentName: user.name },
    },
  });

  return NextResponse.json({
    status: updated.status,
    assignedUser: updated.assignedUser,
    labels: updated.labels,
    slaFirstResponseDeadline: updated.slaFirstResponseDeadline,
  });
});
