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
  const phone = params.get("phone") ?? "";
  const email = params.get("email") ?? "";

  try {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (phone) qs.set("phone", phone);
    if (email) qs.set("email", email);

    const res = await erpFetch(config, `/customers?${qs}`, {
      signal: AbortSignal.timeout(ERP_REQUEST_TIMEOUT),
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    return jsonError(String(err), 502);
  }
});
