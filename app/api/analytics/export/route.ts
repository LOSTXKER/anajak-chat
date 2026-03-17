import { NextResponse } from "next/server";
import { requireAuth, searchParams, parseDaysParam, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const params = searchParams(request);
  const type = params.get("type") ?? "conversations";
  const days = parseDaysParam(request);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  let csvData: Record<string, unknown>[];
  let filename: string;

  if (type === "conversations") {
    const rows = await prisma.conversation.findMany({
      where: { orgId: user.orgId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        firstResponseAt: true,
        sourceAdId: true,
        sourcePlacement: true,
        slaBreachedAt: true,
        contact: { select: { displayName: true, phone: true, email: true, platform: true } },
        assignedUser: { select: { name: true } },
      },
    });
    csvData = rows.map((r) => ({
      id: r.id,
      status: r.status,
      priority: r.priority,
      platform: r.contact.platform,
      customer: r.contact.displayName ?? "",
      phone: r.contact.phone ?? "",
      email: r.contact.email ?? "",
      assigned_to: r.assignedUser?.name ?? "",
      source_ad_id: r.sourceAdId ?? "",
      source_placement: r.sourcePlacement ?? "",
      sla_breached: r.slaBreachedAt ? "yes" : "no",
      first_response_minutes: r.firstResponseAt
        ? Math.round((r.firstResponseAt.getTime() - r.createdAt.getTime()) / 60000)
        : "",
      created_at: r.createdAt.toISOString(),
      resolved_at: r.resolvedAt?.toISOString() ?? "",
    }));
    filename = `conversations-${days}d.csv`;
  } else if (type === "orders") {
    const rows = await prisma.order.findMany({
      where: { orgId: user.orgId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        orderNumber: true,
        status: true,
        amount: true,
        createdAt: true,
        sourceAdId: true,
        sourcePlacement: true,
        erpOrderId: true,
        contact: { select: { displayName: true, phone: true, platform: true } },
      },
    });
    csvData = rows.map((r) => ({
      order_number: r.orderNumber,
      status: r.status,
      amount: Number(r.amount),
      platform: r.contact.platform,
      customer: r.contact.displayName ?? "",
      phone: r.contact.phone ?? "",
      source_ad_id: r.sourceAdId ?? "",
      source_placement: r.sourcePlacement ?? "",
      erp_order_id: r.erpOrderId ?? "",
      created_at: r.createdAt.toISOString(),
    }));
    filename = `orders-${days}d.csv`;
  } else {
    // contacts
    const rows = await prisma.contact.findMany({
      where: { orgId: user.orgId },
      orderBy: { lastSeenAt: "desc" },
      take: 5000,
      select: {
        displayName: true,
        platform: true,
        phone: true,
        email: true,
        segment: true,
        tags: true,
        totalOrders: true,
        totalRevenue: true,
        totalConversations: true,
        firstSeenAt: true,
        lastSeenAt: true,
        erpCustomerId: true,
      },
    });
    csvData = rows.map((r) => ({
      name: r.displayName ?? "",
      platform: r.platform,
      phone: r.phone ?? "",
      email: r.email ?? "",
      segment: r.segment ?? "",
      tags: r.tags.join(", "),
      total_orders: r.totalOrders,
      total_revenue: Number(r.totalRevenue),
      total_conversations: r.totalConversations,
      erp_customer_id: r.erpCustomerId ?? "",
      first_seen: r.firstSeenAt.toISOString(),
      last_seen: r.lastSeenAt.toISOString(),
    }));
    filename = `contacts.csv`;
  }

  const csv = Papa.unparse(csvData);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  }) as unknown as NextResponse;
});
