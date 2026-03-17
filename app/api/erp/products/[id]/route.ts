import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { getErpConfig, erpFetch } from "@/lib/erp";
import { ERP_REQUEST_TIMEOUT } from "@/lib/constants";

export const GET = apiHandler(async (_request, context) => {
  const user = await requireAuth();

  const config = getErpConfig(user.organization.settings);
  if (!config || !config.erpEnabled) {
    return jsonError("ERP not configured or disabled", 400);
  }

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  try {
    const res = await erpFetch(config, `/products/${id}`, {
      signal: AbortSignal.timeout(ERP_REQUEST_TIMEOUT),
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    return jsonError(String(err), 502);
  }
});
