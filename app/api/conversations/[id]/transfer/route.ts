import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { requireAuth, requirePermission, jsonError, apiHandler } from "@/lib/api-helpers";

export const POST = apiHandler(async (request, context) => {
  const user = await requireAuth();
  requirePermission(user, "chat:transfer");

  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { toAgentId, reason } = await request.json() as { toAgentId: string; reason?: string };

  if (!toAgentId) return jsonError("toAgentId required", 400);

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
    include: { assignedUser: { select: { name: true } } },
  });
  if (!conversation) return jsonError("Not found", 404);

  const toAgent = await prisma.user.findFirst({
    where: { id: toAgentId, orgId: user.orgId, isActive: true },
    select: { id: true, name: true },
  });
  if (!toAgent) return jsonError("Target agent not found", 404);

  const fromAgentId = conversation.assignedTo;

  await prisma.conversation.update({
    where: { id },
    data: { assignedTo: toAgentId },
  });

  await prisma.conversationEvent.create({
    data: {
      conversationId: id,
      eventType: "transferred",
      actorId: user.id,
      metadata: {
        from: fromAgentId,
        fromName: conversation.assignedUser?.name,
        to: toAgentId,
        toName: toAgent.name,
        reason: reason ?? null,
      },
    },
  });

  await createNotification({
    orgId: user.orgId,
    userId: toAgentId,
    type: "transfer",
    title: `${user.name} โอนแชทให้คุณ`,
    body: reason ? `เหตุผล: ${reason}` : "คลิกเพื่อดูการสนทนา",
    link: `/inbox`,
  });

  return NextResponse.json({ success: true, assignedTo: toAgentId, agentName: toAgent.name });
});
