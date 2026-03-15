import { NextResponse } from "next/server";
import { requireAuth, requirePermission, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getErpConfig } from "@/lib/erp";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const config = getErpConfig(user.organization.settings);
  if (!config) {
    return NextResponse.json({
      erpBaseUrl: "",
      erpApiKey: "",
      erpWebhookSecret: "",
      erpEnabled: false,
    });
  }

  // Mask the API key
  return NextResponse.json({
    erpBaseUrl: config.erpBaseUrl,
    erpApiKey: config.erpApiKey ? "••••••••" + config.erpApiKey.slice(-4) : "",
    erpWebhookSecret: config.erpWebhookSecret ? "••••••••" : "",
    erpEnabled: config.erpEnabled,
  });
});

export const PUT = apiHandler(async (request) => {
  const user = await requireAuth();
  requirePermission(user, "settings:erp");

  const body = await request.json() as {
    erpBaseUrl?: string;
    erpApiKey?: string;
    erpWebhookSecret?: string;
    erpEnabled?: boolean;
  };

  const currentSettings = (user.organization.settings ?? {}) as Record<string, unknown>;

  // Only update if non-masked value provided (don't overwrite with masked placeholder)
  const patch: Record<string, unknown> = {};
  if (body.erpBaseUrl !== undefined) patch.erpBaseUrl = body.erpBaseUrl;
  if (body.erpApiKey && !body.erpApiKey.startsWith("••••")) patch.erpApiKey = body.erpApiKey;
  if (body.erpWebhookSecret && !body.erpWebhookSecret.startsWith("••••")) {
    patch.erpWebhookSecret = body.erpWebhookSecret;
  }
  if (body.erpEnabled !== undefined) patch.erpEnabled = body.erpEnabled;

  await prisma.organization.update({
    where: { id: user.orgId },
    data: { settings: { ...currentSettings, ...patch } as object },
  });

  return NextResponse.json({ success: true });
});
