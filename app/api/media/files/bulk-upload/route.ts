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
  const folderId = formData.get("folderId") as string | null;
  const files = formData.getAll("files") as File[];

  if (files.length === 0) return jsonError("No files provided", 400);
  if (files.length > 20) return jsonError("Maximum 20 files per upload", 400);

  const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/", "application/pdf", "application/vnd", "application/msword", "text/"];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const supabase = await createServiceClient();

  const results: Array<Record<string, unknown>> = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p))) {
      errors.push(`${file.name}: File type "${file.type}" not allowed`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: Exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      continue;
    }
    try {
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
        errors.push(`${file.name}: ${uploadError.message}`);
        continue;
      }

      const mediaFile = await prisma.mediaFile.create({
        data: {
          orgId: user.orgId,
          folderId: folderId ?? null,
          originalName: file.name,
          storageKey,
          fileType: getFileType(file.type),
          mimeType: file.type,
          fileSize: BigInt(file.size),
          uploadedBy: user.id,
          tags: [],
        },
      });

      results.push({ ...mediaFile, fileSize: mediaFile.fileSize.toString() });
    } catch {
      errors.push(`${file.name}: Upload failed`);
    }
  }

  return NextResponse.json({ files: results, errors, uploaded: results.length, failed: errors.length });
});
