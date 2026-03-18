import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import {
  createRichMenu,
  uploadRichMenuImage,
  listRichMenus,
  deleteRichMenu,
  getDefaultRichMenuId,
  type LineCredentials,
  type RichMenuRequest,
} from "@/lib/integrations/line";

function getLineChannel(orgId: string) {
  return prisma.channel.findFirst({
    where: { orgId, platform: "line", isActive: true },
  });
}

export const GET = apiHandler(async () => {
  const user = await requireAuth();
  const channel = await getLineChannel(user.orgId);
  if (!channel) return jsonError("LINE channel not found", 404);

  const creds = channel.credentials as unknown as LineCredentials;
  const [menus, defaultId] = await Promise.all([
    listRichMenus(creds),
    getDefaultRichMenuId(creds),
  ]);

  return NextResponse.json({ menus, defaultRichMenuId: defaultId });
});

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const channel = await getLineChannel(user.orgId);
  if (!channel) return jsonError("LINE channel not found", 404);

  const formData = await req.formData();
  const menuJson = formData.get("menu") as string;
  const image = formData.get("image") as File | null;

  if (!menuJson) return jsonError("menu data required", 400);
  if (!image) return jsonError("image required", 400);

  const menu = JSON.parse(menuJson) as RichMenuRequest;
  const creds = channel.credentials as unknown as LineCredentials;

  const result = await createRichMenu(creds, menu);
  if ("error" in result) return jsonError(result.error, 400);

  const imageBuffer = await image.arrayBuffer();
  const uploaded = await uploadRichMenuImage(creds, result.richMenuId, imageBuffer, image.type);
  if (!uploaded) return jsonError("Failed to upload rich menu image", 500);

  return NextResponse.json({ richMenuId: result.richMenuId }, { status: 201 });
});

export const DELETE = apiHandler(async (req) => {
  const user = await requireAuth();
  const channel = await getLineChannel(user.orgId);
  if (!channel) return jsonError("LINE channel not found", 404);

  const { richMenuId } = (await req.json()) as { richMenuId: string };
  if (!richMenuId) return jsonError("richMenuId required", 400);

  const creds = channel.credentials as unknown as LineCredentials;
  const ok = await deleteRichMenu(creds, richMenuId);
  if (!ok) return jsonError("Failed to delete rich menu", 500);

  return NextResponse.json({ success: true });
});
