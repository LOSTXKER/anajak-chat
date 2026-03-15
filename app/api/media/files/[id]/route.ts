import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";

export const GET = apiHandler(async (_request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const file = await prisma.mediaFile.findFirst({ where: { id, orgId: user.orgId } });
  if (!file) return jsonError("Not found", 404);

  const supabase = await createServiceClient();
  const { data } = supabase.storage.from("media").getPublicUrl(file.storageKey);

  return NextResponse.json({ ...file, fileSize: file.fileSize.toString(), url: data.publicUrl });
});

export const PATCH = apiHandler(async (request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await request.json();

  const file = await prisma.mediaFile.findFirst({ where: { id, orgId: user.orgId } });
  if (!file) return jsonError("Not found", 404);

  const updated = await prisma.mediaFile.update({
    where: { id },
    data: {
      ...(body.originalName !== undefined && { originalName: body.originalName }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.altText !== undefined && { altText: body.altText }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.folderId !== undefined && { folderId: body.folderId }),
    },
  });

  return NextResponse.json({ ...updated, fileSize: updated.fileSize.toString() });
});

export const DELETE = apiHandler(async (_request, context) => {
  const user = await requireAuth();

  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const file = await prisma.mediaFile.findFirst({ where: { id, orgId: user.orgId } });
  if (!file) return jsonError("Not found", 404);

  const supabase = await createServiceClient();
  await supabase.storage.from("media").remove([file.storageKey]);
  await prisma.mediaFile.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
