import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSync } from "@/lib/erp";
import { validateErpWebhook, isWebhookError } from "@/lib/webhooks/erp-helpers";

export async function POST(request: NextRequest) {
  const ctx = await validateErpWebhook(request);
  if (isWebhookError(ctx)) return ctx;

  const { orgId, payload } = ctx;

  const erpCustomerId = payload.id as string | undefined;
  const phone = payload.phone as string | undefined;
  const email = payload.email as string | undefined;

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
