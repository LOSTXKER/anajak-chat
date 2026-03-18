import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";

function getFileType(mimeType: string): "image" | "video" | "pdf" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    mimeType === "text/plain"
  )
    return "document";
  return "other";
}

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folderId = formData.get("folderId") as string | null;
  const description = formData.get("description") as string | null;
  const tags = formData.get("tags") as string | null;

  if (!file) return jsonError("No file provided", 400);

  const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/", "application/pdf", "application/vnd", "application/msword", "text/"];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  if (!ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p))) {
    return jsonError(`File type "${file.type}" is not allowed`, 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    return jsonError(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, 400);
  }

  const supabase = await createServiceClient();

  const ext = file.name.split(".").pop() ?? "bin";
  const fileId = crypto.randomUUID();
  const storageKey = `${user.orgId}/${folderId ?? "root"}/${fileId}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(storageKey, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return jsonError(uploadError.message, 500);
  }

  const fileType = getFileType(file.type);

  const mediaFile = await prisma.mediaFile.create({
    data: {
      orgId: user.orgId,
      folderId: folderId ?? null,
      originalName: file.name,
      storageKey,
      fileType,
      mimeType: file.type,
      fileSize: BigInt(file.size),
      uploadedBy: user.id,
      description: description ?? null,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    },
  });

  return NextResponse.json({ ...mediaFile, fileSize: mediaFile.fileSize.toString() });
});
