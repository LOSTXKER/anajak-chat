import { NextResponse } from "next/server";
import { requireAuth, searchParams, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const params = searchParams(request);
  const days = parseInt(params.get("days") ?? "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [contacts, conversations, ordersAny, ordersDelivered] = await Promise.all([
    prisma.contact.count({ where: { orgId: user.orgId, firstSeenAt: { gte: since } } }),
    prisma.conversation.count({ where: { orgId: user.orgId, createdAt: { gte: since } } }),
    prisma.order.count({ where: { orgId: user.orgId, createdAt: { gte: since } } }),
    prisma.order.count({ where: { orgId: user.orgId, status: "delivered", createdAt: { gte: since } } }),
  ]);

  return NextResponse.json({
    funnel: [
      { stage: "ลูกค้าใหม่", count: contacts },
      { stage: "เริ่มสนทนา", count: conversations },
      { stage: "สั่งซื้อ", count: ordersAny },
      { stage: "ได้รับสินค้า", count: ordersDelivered },
    ],
  });
});
