import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getErpConfig, verifyErpWebhook } from "@/lib/erp";
import type { ErpConfig } from "@/lib/erp";

export interface ErpWebhookContext {
  orgId: string;
  rawBody: string;
  payload: Record<string, unknown>;
  config: ErpConfig;
}

/**
 * Validates an incoming ERP webhook request.
 * Checks orgId, org existence, ERP config, signature, and JSON body.
 * Returns an ErpWebhookContext on success, or a NextResponse error on failure.
 */
export async function validateErpWebhook(
  request: NextRequest
): Promise<ErpWebhookContext | NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-erp-signature");
  const orgId =
    request.headers.get("x-org-id") ??
    request.nextUrl.searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  }

  const config = getErpConfig(org.settings);
  if (!config) {
    return NextResponse.json({ error: "ERP not configured" }, { status: 400 });
  }

  if (
    config.erpWebhookSecret &&
    !verifyErpWebhook(rawBody, signature, config.erpWebhookSecret)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  return { orgId, rawBody, payload, config };
}

export function isWebhookError(
  result: ErpWebhookContext | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
