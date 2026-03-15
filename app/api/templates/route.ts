import { NextResponse } from "next/server";
import { requireAuth, searchParams, jsonError, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const sp = searchParams(request);
  const search = sp.get("search") ?? "";
  const category = sp.get("category");

  const templates = await prisma.quickReplyTemplate.findMany({
    where: {
      orgId: user.orgId,
      isActive: true,
      ...(category ? { category: category as "greeting" | "pricing" | "shipping" | "closing" | "custom" } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
              { shortcut: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(templates);
});

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();

  const { name, content, category = "custom", shortcut } = await request.json();

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
      createdBy: user.id,
    },
  });

  return NextResponse.json(template, { status: 201 });
});
