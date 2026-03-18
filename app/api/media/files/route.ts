import { NextResponse } from "next/server";
import { requireAuth, parsePagination, searchParams, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const params = searchParams(request);
  const folderId = params.get("folderId") || null;
  const fileType = params.get("fileType");
  const search = params.get("search") ?? "";
  const { page, limit, skip } = parsePagination(request, { limit: 48 });

  const [files, total] = await Promise.all([
    prisma.mediaFile.findMany({
      where: {
        orgId: user.orgId,
        ...(folderId !== null ? { folderId } : {}),
        ...(fileType ? { fileType: fileType as "image" | "video" | "pdf" | "document" | "other" } : {}),
        ...(search
          ? {
              OR: [
                { originalName: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { tags: { has: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.mediaFile.count({
      where: {
        orgId: user.orgId,
        ...(folderId !== null ? { folderId } : {}),
        ...(fileType ? { fileType: fileType as "image" | "video" | "pdf" | "document" | "other" } : {}),
      },
    }),
  ]);

  return NextResponse.json({ files, total, page, totalPages: Math.ceil(total / limit) });
});
