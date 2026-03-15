import { NextResponse } from "next/server";
import { requireAuth, searchParams, jsonError, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const sp = searchParams(request);
  const type = sp.get("type");
  const id = sp.get("id");

  if (!type || !id) {
    return jsonError("type and id required", 400);
  }

  const notes = await prisma.note.findMany({
    where: {
      orgId: user.orgId,
      noteableType: type as "conversation" | "contact",
      noteableId: id,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(notes);
});

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();

  const { noteableType, noteableId, content, mentions = [] } = await request.json();

  if (!noteableType || !noteableId || !content) {
    return jsonError("noteableType, noteableId, content required", 400);
  }

  const note = await prisma.note.create({
    data: {
      orgId: user.orgId,
      noteableType,
      noteableId,
      content,
      mentions,
      authorId: user.id,
    },
  });

  return NextResponse.json(note, { status: 201 });
});
