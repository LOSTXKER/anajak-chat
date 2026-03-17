import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-helpers";

const SESSION_MINUTES = 30;

export const POST = apiHandler(async (_request, { params }) => {
  const user = await requireAuth();
  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const startable = ["pending", "expired", "follow_up", "missed", "resolved", "closed", "spam", "blocked"];
  if (!startable.includes(conversation.status)) {
    return NextResponse.json({ error: "Cannot start from current status" }, { status: 400 });
  }

  const deadline = new Date(Date.now() + SESSION_MINUTES * 60 * 1000);

  const updated = await prisma.conversation.update({
    where: { id },
    data: {
      status: "open",
      assignedTo: user.id,
      sessionDeadline: deadline,
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
      metadata: { agentName: user.name, sessionMinutes: SESSION_MINUTES },
    },
  });

  return NextResponse.json({
    status: updated.status,
    assignedUser: updated.assignedUser,
    sessionDeadline: updated.sessionDeadline?.toISOString() ?? null,
  });
});
