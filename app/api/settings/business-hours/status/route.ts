import { NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-helpers";
import { isWithinBusinessHours, getNextOpenTime, extractBusinessHours } from "@/lib/business-hours";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const config = extractBusinessHours(user.organization.settings);
  const isOpen = isWithinBusinessHours(config);
  const nextOpenAt = isOpen ? null : getNextOpenTime(config);

  return NextResponse.json({
    isOpen,
    nextOpenAt: nextOpenAt?.toISOString() ?? null,
    timezone: config.timezone,
  });
});
