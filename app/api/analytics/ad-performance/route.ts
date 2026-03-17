import { NextResponse } from "next/server";
import { requireAuth, requirePermission, searchParams, parseDaysParam, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();
  requirePermission(user, "analytics:view");

  const params = searchParams(request);
  const days = parseDaysParam(request);
  const platform = params.get("platform") ?? undefined;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Fetch all ad-sourced conversations in the period
  const conversations = await prisma.conversation.findMany({
    where: {
      orgId: user.orgId,
      sourceAdId: { not: null },
      createdAt: { gte: since },
      ...(platform ? { channel: { platform: platform as "facebook" | "instagram" } } : {}),
    },
    select: {
      id: true,
      sourceAdId: true,
      sourceAdName: true,
      sourcePlacement: true,
      sourceCampaignId: true,
      createdAt: true,
      channel: { select: { platform: true } },
      orders: {
        select: { id: true, amount: true, status: true },
      },
    },
  });

  // Aggregate by ad
  const adMap = new Map<string, {
    adId: string;
    adName: string | null;
    placement: string | null;
    campaignId: string | null;
    platform: string;
    conversationCount: number;
    orderCount: number;
    revenue: number;
    conversionRate: number;
  }>();

  for (const conv of conversations) {
    const adId = conv.sourceAdId!;
    const existing = adMap.get(adId) ?? {
      adId,
      adName: conv.sourceAdName,
      placement: conv.sourcePlacement,
      campaignId: conv.sourceCampaignId,
      platform: conv.channel.platform,
      conversationCount: 0,
      orderCount: 0,
      revenue: 0,
      conversionRate: 0,
    };

    existing.conversationCount += 1;

    const completedOrders = conv.orders.filter((o) =>
      ["confirmed", "shipped", "delivered"].includes(o.status)
    );
    existing.orderCount += completedOrders.length;
    existing.revenue += completedOrders.reduce((s, o) => s + Number(o.amount), 0);

    adMap.set(adId, existing);
  }

  // Compute conversion rates
  const ads = Array.from(adMap.values()).map((ad) => ({
    ...ad,
    conversionRate:
      ad.conversationCount > 0
        ? Math.round((ad.orderCount / ad.conversationCount) * 100)
        : 0,
    revenue: Math.round(ad.revenue),
  }));

  // Sort by revenue desc
  ads.sort((a, b) => b.revenue - a.revenue);

  // Aggregate placement performance
  const placementMap = new Map<string, { placement: string; conversationCount: number; revenue: number }>();
  for (const conv of conversations) {
    const p = conv.sourcePlacement ?? "unknown";
    const existing = placementMap.get(p) ?? { placement: p, conversationCount: 0, revenue: 0 };
    existing.conversationCount += 1;
    existing.revenue += conv.orders.reduce((s, o) => s + Number(o.amount), 0);
    placementMap.set(p, existing);
  }
  const placements = Array.from(placementMap.values()).sort((a, b) => b.revenue - a.revenue);

  // Summary totals
  const totalConversations = conversations.length;
  const totalRevenue = ads.reduce((s, a) => s + a.revenue, 0);
  const totalOrders = ads.reduce((s, a) => s + a.orderCount, 0);
  const avgConversionRate =
    ads.length > 0
      ? Math.round(ads.reduce((s, a) => s + a.conversionRate, 0) / ads.length)
      : 0;

  return NextResponse.json({
    summary: { totalConversations, totalRevenue, totalOrders, avgConversionRate },
    ads,
    placements,
    days,
  });
});
