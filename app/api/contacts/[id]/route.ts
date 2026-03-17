import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler(async (_request, { params }) => {
  const user = await requireAuth();
  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!contact) return jsonError("Not found", 404);
  return NextResponse.json(contact);
});

export const PATCH = apiHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!contact) return jsonError("Not found", 404);

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.displayName !== undefined) data.displayName = body.displayName;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.tags !== undefined && Array.isArray(body.tags)) data.tags = body.tags;
  if (body.segment !== undefined) data.segment = body.segment || null;

  const updated = await prisma.contact.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
});
