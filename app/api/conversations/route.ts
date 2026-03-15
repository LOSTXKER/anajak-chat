import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, parsePagination, searchParams, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const sp = searchParams(request);
  const status = sp.get("status");
  const assignedTo = sp.get("assignedTo");
  const search = sp.get("search") ?? "";
  const { page, limit, skip } = parsePagination(request, { limit: 30 });

  const where = {
    orgId: user.orgId,
    ...(status && status !== "all" ? { status: status as "open" | "pending" | "resolved" | "closed" } : {}),
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
        _count: {
          select: { messages: true },
        },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return NextResponse.json({
    conversations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});
