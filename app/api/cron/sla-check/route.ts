import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processSlaBreaches } from "@/lib/sla";

// This endpoint should be called by Vercel Cron (every 5 minutes)
// vercel.json: { "crons": [{ "path": "/api/cron/sla-check", "schedule": "*/5 * * * *" }] }
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Process all organizations with active SLA configs
  const orgs = await prisma.slaConfig
    .findMany({ where: { isActive: true }, distinct: ["orgId"], select: { orgId: true } });

  const results: Array<{ orgId: string; ok: boolean; error?: string }> = [];

  for (const { orgId } of orgs) {
    try {
      await processSlaBreaches(orgId);
      results.push({ orgId, ok: true });
    } catch (err) {
      results.push({ orgId, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
