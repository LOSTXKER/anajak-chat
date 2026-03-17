import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler } from "@/lib/api-helpers";

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  const contacts = await prisma.contact.findMany({
    where: { orgId: user.orgId, tags: { isEmpty: false } },
    select: { tags: true },
  });

  const tagSet = new Set<string>();
  for (const c of contacts) {
    for (const t of c.tags) tagSet.add(t);
  }

  return NextResponse.json([...tagSet].sort());
});
