import { NextResponse } from "next/server";
import { retryFailedCapiEvents } from "@/lib/capi";

// Called by Vercel Cron every 5 minutes
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const retried = await retryFailedCapiEvents();
  return NextResponse.json({ retried });
}
