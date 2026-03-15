import { NextResponse } from "next/server";
import { requireAuth, searchParams, parsePagination, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import type { KbCategory } from "@/lib/generated/prisma/client";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const sp = searchParams(request);
  const category = sp.get("category") as KbCategory | null;
  const search = sp.get("q") ?? "";
  const { page, limit, skip } = parsePagination(request);
  const activeOnly = sp.get("activeOnly") !== "false";

  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      orgId: user.orgId,
      ...(category ? { category } : {}),
      ...(activeOnly ? { isActive: true } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    skip,
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      tags: true,
      isActive: true,
      usageCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.knowledgeArticle.count({
    where: {
      orgId: user.orgId,
      ...(category ? { category } : {}),
      ...(activeOnly ? { isActive: true } : {}),
    },
  });

  return NextResponse.json({ articles, total });
});

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();

  const body = await request.json() as {
    title: string;
    content: string;
    category?: KbCategory;
    tags?: string[];
  };

  if (!body.title || !body.content) {
    return jsonError("title and content required", 400);
  }

  const article = await prisma.knowledgeArticle.create({
    data: {
      orgId: user.orgId,
      title: body.title,
      content: body.content,
      category: body.category ?? "faq",
      tags: body.tags ?? [],
      createdBy: user.id,
    },
  });

  return NextResponse.json(article, { status: 201 });
});
