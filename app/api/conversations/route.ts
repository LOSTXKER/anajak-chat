import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, parsePagination, searchParams, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const sp = searchParams(request);
  const status = sp.get("status");
  const label = sp.get("label");
  const platform = sp.get("platform");
  const tag = sp.get("tag");
  const assignedTo = sp.get("assignedTo");
  const search = sp.get("search") ?? "";
  const { page, limit, skip } = parsePagination(request, { limit: 30 });

  const where = {
    orgId: user.orgId,
    ...(status && status !== "all" ? { status: status as "open" | "pending" | "resolved" | "closed" } : {}),
    ...(label ? { labels: { has: label } } : {}),
    ...(platform ? { channel: { platform: platform as "facebook" | "instagram" | "line" | "whatsapp" | "web" } } : {}),
    ...(tag ? { contact: { tags: { has: tag } } } : {}),
    ...(assignedTo ? { assignedTo } : {}),
    ...(search
      ? {
          OR: [
            { contact: { displayName: { contains: search, mode: "insensitive" as const } } },
            { messages: { some: { content: { contains: search, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip,
      take: limit,
      include: {
        contact: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            platform: true,
            platformId: true,
            phone: true,
            email: true,
            tags: true,
          },
        },
        channel: {
          select: { id: true, platform: true, name: true },
        },
        assignedUser: {
          select: { id: true, name: true, avatarUrl: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, contentType: true, createdAt: true, senderType: true },
        },
        reads: {
          where: { userId: user.id },
          select: { lastReadAt: true },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  const convIds = conversations.map((c) => c.id);
  const unreadCounts = convIds.length > 0
    ? await prisma.message.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: convIds },
          senderType: "contact",
        },
        _count: true,
      })
    : [];

  const readMap = new Map(
    conversations.map((c) => [c.id, c.reads[0]?.lastReadAt ?? null])
  );

  const totalContactMsgs = new Map(
    unreadCounts.map((g) => [g.conversationId, g._count])
  );

  const unreadAfterRead = convIds.length > 0
    ? await Promise.all(
        conversations.map(async (c) => {
          const lastRead = readMap.get(c.id);
          if (!lastRead) return { id: c.id, count: totalContactMsgs.get(c.id) ?? 0 };
          const count = await prisma.message.count({
            where: {
              conversationId: c.id,
              senderType: "contact",
              createdAt: { gt: lastRead },
            },
          });
          return { id: c.id, count };
        })
      )
    : [];

  const unreadMap = new Map(unreadAfterRead.map((u) => [u.id, u.count]));

  const enriched = conversations.map(({ reads: _reads, ...c }) => ({
    ...c,
    unreadCount: unreadMap.get(c.id) ?? 0,
  }));

  return NextResponse.json({
    conversations: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});
