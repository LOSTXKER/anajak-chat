import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { getErpConfig, erpFetch } from "@/lib/erp";

export const POST = apiHandler(async () => {
  const user = await requireAuth();

  const config = getErpConfig(user.organization.settings);
  if (!config) {
    return jsonError("ERP not configured", 400);
  }

  try {
    // Try /health first, then root
    const res = await erpFetch(config, "/health", {
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      return NextResponse.json({ success: true, status: res.status, url: config.erpBaseUrl });
    }

    // Try root if /health fails
    const res2 = await erpFetch(config, "/", { signal: AbortSignal.timeout(5000) });
    return NextResponse.json({
      success: res2.ok || res2.status < 500,
      status: res2.status,
      url: config.erpBaseUrl,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
    });
  }
});
