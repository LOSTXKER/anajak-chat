import { NextResponse } from "next/server";
import { requireAuth, searchParams, jsonError, apiHandler, parsePagination } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const sp = searchParams(request);
  const search = sp.get("search") ?? "";
  const category = sp.get("category");

  const where = {
    orgId: user.orgId,
    isActive: true,
    ...(category ? { category: category as "greeting" | "pricing" | "shipping" | "closing" | "custom" } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { content: { contains: search, mode: "insensitive" as const } },
            { shortcut: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const { skip, limit, page } = parsePagination(request, { limit: 50 });
  const [templates, total] = await Promise.all([
    prisma.quickReplyTemplate.findMany({
      where,
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.quickReplyTemplate.count({ where }),
  ]);

  return NextResponse.json({ templates, total, page });
});

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();

  const { name, content, category = "custom", shortcut, templateType = "text", buttons, imageUrl } = await request.json();

  if (!name || !content) {
    return jsonError("name and content required", 400);
  }

  const template = await prisma.quickReplyTemplate.create({
    data: {
      orgId: user.orgId,
      name,
      content,
      category,
      shortcut: shortcut ?? null,
      templateType,
      buttons: buttons ?? undefined,
      imageUrl: imageUrl ?? null,
      createdBy: user.id,
    },
  });

  return NextResponse.json(template, { status: 201 });
});
