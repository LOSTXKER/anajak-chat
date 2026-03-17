import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getErpConfig, erpFetch, logSync } from "@/lib/erp";
import { ERP_REQUEST_TIMEOUT } from "@/lib/constants";

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();

  const body = await request.json() as { contactId: string };
  if (!body.contactId) {
    return jsonError("contactId required", 400);
  }

  const contact = await prisma.contact.findFirst({
    where: { id: body.contactId, orgId: user.orgId },
  });
  if (!contact) return jsonError("Contact not found", 404);

  const config = getErpConfig(user.organization.settings);
  if (!config || !config.erpEnabled) {
    return jsonError("ERP not configured or disabled", 400);
  }

  const payload = {
    name: contact.displayName,
    phone: contact.phone,
    email: contact.email,
    source: "anajak_chat",
    externalId: contact.id,
  };

  try {
    const res = await erpFetch(config, "/customers", {
      method: "POST",
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(ERP_REQUEST_TIMEOUT),
    });

    const data = await res.json() as { id?: string; customerId?: string };

    if (!res.ok) {
      await logSync({
        orgId: user.orgId,
        type: "customer_sync",
        direction: "outbound",
        status: "failed",
        entityId: contact.id,
        requestPayload: payload,
        responsePayload: data,
        errorMessage: `ERP returned ${res.status}`,
      });
      return NextResponse.json({ error: "ERP error", detail: data }, { status: res.status });
    }

    const erpCustomerId = (data.id ?? data.customerId ?? "") as string;

    if (erpCustomerId) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { erpCustomerId },
      });
    }

    await logSync({
      orgId: user.orgId,
      type: "customer_sync",
      direction: "outbound",
      status: "success",
      entityId: erpCustomerId || contact.id,
      requestPayload: payload,
      responsePayload: data,
    });

    return NextResponse.json({ erpCustomerId, contact: { ...contact, erpCustomerId } });
  } catch (err) {
    await logSync({
      orgId: user.orgId,
      type: "customer_sync",
      direction: "outbound",
      status: "failed",
      entityId: contact.id,
      requestPayload: payload,
      errorMessage: String(err),
    });
    return jsonError(String(err), 502);
  }
});
