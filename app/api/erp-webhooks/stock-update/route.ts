import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getErpConfig, verifyErpWebhook, logSync } from "@/lib/erp";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-erp-signature");
  const orgId = request.headers.get("x-org-id") ?? request.nextUrl.searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const config = getErpConfig(org.settings);
  if (!config) return NextResponse.json({ error: "ERP not configured" }, { status: 400 });

  if (config.erpWebhookSecret && !verifyErpWebhook(rawBody, signature, config.erpWebhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await logSync({
    orgId,
    type: "webhook_stock_update",
    direction: "inbound",
    status: "success",
    entityId: (payload as Record<string, unknown>)?.productId as string | undefined,
    requestPayload: payload,
  });

  return NextResponse.json({ received: true });
}
