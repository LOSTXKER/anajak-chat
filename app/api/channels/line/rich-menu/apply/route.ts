import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import {
  setDefaultRichMenu,
  removeDefaultRichMenu,
  type LineCredentials,
} from "@/lib/integrations/line";

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const channel = await prisma.channel.findFirst({
    where: { orgId: user.orgId, platform: "line", isActive: true },
  });
  if (!channel) return jsonError("LINE channel not found", 404);

  const { richMenuId, remove } = (await req.json()) as { richMenuId?: string; remove?: boolean };
  const creds = channel.credentials as unknown as LineCredentials;

  if (remove) {
    const ok = await removeDefaultRichMenu(creds);
    if (!ok) return jsonError("Failed to remove default rich menu", 500);
    return NextResponse.json({ success: true, defaultRichMenuId: null });
  }

  if (!richMenuId) return jsonError("richMenuId required", 400);
  const ok = await setDefaultRichMenu(creds, richMenuId);
  if (!ok) return jsonError("Failed to set default rich menu", 500);

  return NextResponse.json({ success: true, defaultRichMenuId: richMenuId });
});
