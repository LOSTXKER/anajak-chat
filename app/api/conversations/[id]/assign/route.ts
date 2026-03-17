import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { requireAuth, jsonError, apiHandler } from "@/lib/api-helpers";

export const POST = apiHandler(async (request, context) => {
  const user = await requireAuth();
  const body = await request.json().catch(() => ({})) as { agentId?: string };

  const permissions = user.role.permissions as string[];

  if (!hasPermission(permissions, "chat:assign") && !hasPermission(permissions, "*")) {
    if (body.agentId !== user.id) {
      return jsonError("Forbidden", 403);
    }
  }

  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const agentId = body.agentId ?? user.id;

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!conversation) return jsonError("Not found", 404);

  const agent = await prisma.user.findFirst({
    where: { id: agentId, orgId: user.orgId, isActive: true },
    select: { id: true, name: true },
  });
  if (!agent) return jsonError("Agent not found", 404);

  const previousAssignee = conversation.assignedTo;

  const updated = await prisma.conversation.update({
    where: { id },
    data: { assignedTo: agentId },
    include: {
      assignedUser: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  await prisma.conversationEvent.create({
    data: {
      conversationId: id,
      eventType: "assigned",
      actorId: user.id,
      metadata: {
        from: previousAssignee,
        to: agentId,
        agentName: agent.name,
      },
    },
  });

  if (agentId !== user.id) {
    await createNotification({
      orgId: user.orgId,
      userId: agentId,
      type: "assignment",
      title: `${user.name} มอบหมายแชทให้คุณ`,
      body: "คลิกเพื่อดูการสนทนา",
      link: `/inbox`,
    });
  }

  return NextResponse.json(updated);
});
