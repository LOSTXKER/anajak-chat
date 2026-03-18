import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, apiHandler, searchParams as getSearchParams } from "@/lib/api-helpers";

export const GET = apiHandler(async (req, context) => {
  const user = await requireAuth();
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const sp = getSearchParams(req);
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "50")));

  const contact = await prisma.contact.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!contact) return jsonError("Not found", 404);

  const [conversations, orders, notes] = await Promise.all([
    prisma.conversation.findMany({
      where: { contactId: id, orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        sourceAdId: true,
        sourceAdName: true,
        aiSummary: true,
        channel: { select: { platform: true } },
        messages: { take: 1, orderBy: { createdAt: "asc" }, select: { content: true } },
      },
    }),
    prisma.order.findMany({
      where: { contactId: id, orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        amount: true,
        status: true,
        createdAt: true,
        sourceAdId: true,
        erpOrderId: true,
      },
    }),
    prisma.note.findMany({
      where: {
        orgId: user.orgId,
        noteableType: "contact",
        noteableId: id,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 20),
      select: {
        id: true,
        content: true,
        createdAt: true,
        authorId: true,
      },
    }),
  ]);

  type TimelineEvent = {
    type: string;
    date: string;
    id: string;
    [key: string]: unknown;
  };

  const events: TimelineEvent[] = [
    ...conversations.map((c) => ({
      type: "conversation",
      date: c.createdAt.toISOString(),
      id: c.id,
      status: c.status,
      platform: c.channel.platform,
      sourceAdId: c.sourceAdId,
      sourceAdName: c.sourceAdName,
      firstMessage: c.messages[0]?.content ?? null,
      aiSummary: c.aiSummary,
      resolvedAt: c.resolvedAt?.toISOString() ?? null,
    })),
    ...orders.map((o) => ({
      type: "order",
      date: o.createdAt.toISOString(),
      id: o.id,
      orderNumber: o.orderNumber,
      amount: Number(o.amount),
      status: o.status,
      sourceAdId: o.sourceAdId,
      erpOrderId: o.erpOrderId,
    })),
    ...notes.map((n) => ({
      type: "note",
      date: n.createdAt.toISOString(),
      id: n.id,
      content: n.content,
      authorId: n.authorId,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ contact, events });
});
