import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, parsePagination, searchParams, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const { page, limit, skip } = parsePagination(request);
  const sp = searchParams(request);
  const q = sp.get("q") ?? "";
  const platform = sp.get("platform");
  const segment = sp.get("segment");

  const where = {
    orgId: user.orgId,
    ...(platform ? { platform: platform as "facebook" | "instagram" | "line" | "whatsapp" | "web" | "manual" } : {}),
    ...(segment ? { segment } : {}),
    ...(q
      ? {
          OR: [
            { displayName: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        platform: true,
        phone: true,
        email: true,
        segment: true,
        tags: true,
        totalOrders: true,
        totalRevenue: true,
        totalConversations: true,
        lastSeenAt: true,
        firstSeenAt: true,
        erpCustomerId: true,
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ contacts, total });
});
