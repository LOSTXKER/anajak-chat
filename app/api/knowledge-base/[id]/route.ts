import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import type { KbCategory } from "@/lib/generated/prisma/client";

export const GET = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const article = await prisma.knowledgeArticle.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!article) return jsonError("Not found", 404);
  return NextResponse.json(article);
});

export const PUT = apiHandler(async (request, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const body = await request.json() as {
    title?: string;
    content?: string;
    category?: KbCategory;
    tags?: string[];
    isActive?: boolean;
  };

  const article = await prisma.knowledgeArticle.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!article) return jsonError("Not found", 404);

  const updated = await prisma.knowledgeArticle.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.content !== undefined ? { content: body.content } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const article = await prisma.knowledgeArticle.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!article) return jsonError("Not found", 404);

  await prisma.knowledgeArticle.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
