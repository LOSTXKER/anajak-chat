import { NextResponse } from "next/server";
import { requireAuth, parsePagination, searchParams, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const sp = searchParams(request);
  const q = sp.get("q") ?? "";
  const { page, limit, skip } = parsePagination(request);

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0, page, totalPages: 0 });
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        conversation: { orgId: user.orgId },
        content: { contains: q, mode: "insensitive" },
        contentType: "text",
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        conversation: {
          include: {
            contact: {
              select: { displayName: true, avatarUrl: true, platform: true },
            },
            channel: { select: { name: true, platform: true } },
          },
        },
      },
    }),
    prisma.message.count({
      where: {
        conversation: { orgId: user.orgId },
        content: { contains: q, mode: "insensitive" },
        contentType: "text",
      },
    }),
  ]);

  return NextResponse.json({
    results: messages,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});
