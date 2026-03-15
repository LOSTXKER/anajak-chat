import { NextResponse } from "next/server";
import { requireAuth, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { embedArticle } from "@/lib/kb";

export const POST = apiHandler(async () => {
  const user = await requireAuth();

  const articles = await prisma.knowledgeArticle.findMany({
    where: { orgId: user.orgId, isActive: true },
    select: { id: true },
  });

  let success = 0;
  let failed = 0;
  for (const a of articles) {
    try {
      await embedArticle(a.id);
      success++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ success, failed, total: articles.length });
});
