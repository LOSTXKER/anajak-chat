import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
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

  // Single query to get per-conversation unread counts, respecting each conversation's lastReadAt
  const unreadRows = convIds.length > 0
    ? await prisma.$queryRaw<{ conversation_id: string; count: bigint }[]>`
        SELECT m.conversation_id, COUNT(*) AS count
        FROM messages m
        WHERE m.conversation_id = ANY(ARRAY[${Prisma.join(convIds)}]::uuid[])
          AND m.sender_type = 'contact'
          AND m.created_at > COALESCE(
            (
              SELECT cr.last_read_at
              FROM conversation_reads cr
              WHERE cr.conversation_id = m.conversation_id
                AND cr.user_id = ${user.id}::uuid
            ),
            '1970-01-01'::timestamptz
          )
        GROUP BY m.conversation_id
      `
    : [];

  const unreadMap = new Map(unreadRows.map((r) => [r.conversation_id, Number(r.count)]));

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
