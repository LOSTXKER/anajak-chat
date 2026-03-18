import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError, searchParams } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getRichMenuImage, type LineCredentials } from "@/lib/integrations/line";

export const GET = apiHandler(async (req) => {
  const user = await requireAuth();
  const sp = searchParams(req);
  const richMenuId = sp.get("id");
  if (!richMenuId) return jsonError("id required", 400);

  const channel = await prisma.channel.findFirst({
    where: { orgId: user.orgId, platform: "line", isActive: true },
  });
  if (!channel) return jsonError("LINE channel not found", 404);

  const creds = channel.credentials as unknown as LineCredentials;
  const imageBuffer = await getRichMenuImage(creds, richMenuId);
  if (!imageBuffer) return jsonError("Image not found", 404);

  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
