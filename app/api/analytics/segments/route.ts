import { NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  // Rule-based segmentation using existing data
  const contacts = await prisma.contact.findMany({
    where: { orgId: user.orgId },
    select: {
      id: true,
      totalOrders: true,
      totalRevenue: true,
      lastSeenAt: true,
    },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const segments = {
    "VIP": 0,
    "Regular": 0,
    "Window Shopper": 0,
    "One-timer": 0,
    "At-risk": 0,
  };

  for (const c of contacts) {
    const revenue = Number(c.totalRevenue);
    const lastSeen = c.lastSeenAt ? new Date(c.lastSeenAt) : null;
    const isRecent = lastSeen && lastSeen > thirtyDaysAgo;
    const isAtRisk = lastSeen && lastSeen < ninetyDaysAgo && c.totalOrders > 0;

    if (isAtRisk) {
      segments["At-risk"]++;
    } else if (c.totalOrders >= 5 || revenue >= 5000) {
      segments["VIP"]++;
    } else if (c.totalOrders >= 2) {
      segments["Regular"]++;
    } else if (c.totalOrders === 1) {
      segments["One-timer"]++;
    } else {
      segments["Window Shopper"]++;
    }
  }

  const total = contacts.length;
  return NextResponse.json({
    total,
    segments: Object.entries(segments).map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    })),
  });
});
