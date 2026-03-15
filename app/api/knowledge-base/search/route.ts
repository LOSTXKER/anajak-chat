import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { searchKb } from "@/lib/kb";

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();

  const body = await request.json() as { query: string; topK?: number };
  if (!body.query) return jsonError("query required", 400);

  const results = await searchKb(user.orgId, body.query, body.topK ?? 5);
  return NextResponse.json({ results });
});
