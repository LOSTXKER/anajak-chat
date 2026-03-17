import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-helpers";

export const POST = apiHandler(async (_request, { params }) => {
  const user = await requireAuth();
  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId, status: "open" },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found or not open" }, { status: 404 });
  }

  await prisma.conversation.update({
    where: { id },
    data: { status: "expired" },
  });

  await prisma.conversationEvent.create({
    data: {
      conversationId: id,
      eventType: "expired",
      actorId: user.id,
      metadata: { reason: "session_timeout" },
    },
  });

  return NextResponse.json({ status: "expired" });
});
