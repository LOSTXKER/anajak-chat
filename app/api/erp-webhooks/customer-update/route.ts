import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getErpConfig, verifyErpWebhook, logSync } from "@/lib/erp";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-erp-signature");
  const orgId = request.headers.get("x-org-id") ?? request.nextUrl.searchParams.get("orgId");

  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const config = getErpConfig(org.settings);
  if (!config) return NextResponse.json({ error: "ERP not configured" }, { status: 400 });

  if (config.erpWebhookSecret && !verifyErpWebhook(rawBody, signature, config.erpWebhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const erpCustomerId = payload.id as string | undefined;
  const phone = payload.phone as string | undefined;
  const email = payload.email as string | undefined;

  // Find matching contact
  const contact = await prisma.contact.findFirst({
    where: {
      orgId,
      OR: [
        ...(erpCustomerId ? [{ erpCustomerId }] : []),
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (contact) {
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        displayName: (payload.name as string) ?? contact.displayName,
        phone: phone ?? contact.phone,
        email: email ?? contact.email,
        erpCustomerId: erpCustomerId ?? contact.erpCustomerId,
      },
    });
  }

  await logSync({
    orgId,
    type: "webhook_customer_update",
    direction: "inbound",
    status: "success",
    entityId: erpCustomerId,
    requestPayload: payload,
    responsePayload: contact ? { contactId: contact.id, updated: true } : { updated: false },
  });

  return NextResponse.json({ received: true, updated: !!contact });
}
