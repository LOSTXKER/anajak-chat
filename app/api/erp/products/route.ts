import { NextResponse } from "next/server";
import { requireAuth, searchParams, apiHandler, jsonError } from "@/lib/api-helpers";
import { getErpConfig, erpFetch } from "@/lib/erp";
import { ERP_REQUEST_TIMEOUT } from "@/lib/constants";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const config = getErpConfig(user.organization.settings);
  if (!config || !config.erpEnabled) {
    return jsonError("ERP not configured or disabled", 400);
  }

  const params = searchParams(request);
  const q = params.get("q") ?? "";
  const page = params.get("page") ?? "1";
  const limit = params.get("limit") ?? "20";

  try {
    const qs = new URLSearchParams({ q, page, limit });
    const res = await erpFetch(config, `/products?${qs}`, {
      signal: AbortSignal.timeout(ERP_REQUEST_TIMEOUT),
    });

    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    return jsonError(String(err), 502);
  }
});
