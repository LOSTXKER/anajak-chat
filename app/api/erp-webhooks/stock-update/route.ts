import { NextRequest, NextResponse } from "next/server";
import { logSync } from "@/lib/erp";
import { validateErpWebhook, isWebhookError } from "@/lib/webhooks/erp-helpers";

export async function POST(request: NextRequest) {
  const ctx = await validateErpWebhook(request);
  if (isWebhookError(ctx)) return ctx;

  const { orgId, payload } = ctx;

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
