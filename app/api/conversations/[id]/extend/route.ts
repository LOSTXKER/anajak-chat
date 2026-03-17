import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-helpers";

const ALLOWED_MINUTES = [15, 30, 60];

export const POST = apiHandler(async (request, { params }) => {
  const user = await requireAuth();
  const { id } = await params;
  const { minutes } = await request.json();

  if (!ALLOWED_MINUTES.includes(minutes)) {
    return NextResponse.json({ error: "Invalid minutes" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const base = conversation.sessionDeadline && conversation.sessionDeadline > now
    ? conversation.sessionDeadline
    : now;
  const newDeadline = new Date(base.getTime() + minutes * 60 * 1000);

  await prisma.conversation.update({
    where: { id },
    data: { sessionDeadline: newDeadline },
  });

  return NextResponse.json({ sessionDeadline: newDeadline.toISOString() });
});
