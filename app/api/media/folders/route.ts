import { NextResponse } from "next/server";
import { requireAuth, searchParams, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const params = searchParams(request);
  const parentId = params.get("parentId") ?? null;

  const folders = await prisma.mediaFolder.findMany({
    where: {
      orgId: user.orgId,
      parentId,
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { files: true, children: true } } },
  });

  return NextResponse.json(folders);
});

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();

  const { name, parentId } = await request.json();

  if (!name?.trim()) {
    return jsonError("name required", 400);
  }

  const folder = await prisma.mediaFolder.create({
    data: {
      orgId: user.orgId,
      name: name.trim(),
      parentId: parentId ?? null,
      createdBy: user.id,
    },
  });

  return NextResponse.json(folder, { status: 201 });
});
