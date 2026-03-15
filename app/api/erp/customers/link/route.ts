import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logSync } from "@/lib/erp";

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();

  const body = await request.json() as {
    contactId: string;
    erpCustomerId: string;
  };

  if (!body.contactId || !body.erpCustomerId) {
    return jsonError("contactId and erpCustomerId required", 400);
  }

  const contact = await prisma.contact.findFirst({
    where: { id: body.contactId, orgId: user.orgId },
  });
  if (!contact) {
    return jsonError("Contact not found", 404);
  }

  const updated = await prisma.contact.update({
    where: { id: body.contactId },
    data: { erpCustomerId: body.erpCustomerId },
  });

  await logSync({
    orgId: user.orgId,
    type: "customer_sync",
    direction: "inbound",
    status: "success",
    entityId: body.erpCustomerId,
    requestPayload: { contactId: body.contactId, erpCustomerId: body.erpCustomerId },
  });

  return NextResponse.json({ contact: updated });
});
