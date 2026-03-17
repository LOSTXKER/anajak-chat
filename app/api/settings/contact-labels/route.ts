import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const labels = await prisma.contactLabel.findMany({
    where: { orgId: user.orgId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(labels);
});

export const POST = apiHandler(async (request) => {
  const user = await requireAuth();
  const body = await request.json();

  const label = await prisma.contactLabel.create({
    data: {
      orgId: user.orgId,
      name: body.name,
      color: body.color ?? "#6B7280",
    },
  });

  return NextResponse.json(label, { status: 201 });
});

export const DELETE = apiHandler(async (request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.contactLabel.deleteMany({
    where: { id, orgId: user.orgId },
  });

  return NextResponse.json({ success: true });
});
