import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { embedArticle } from "@/lib/kb";

export const POST = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const article = await prisma.knowledgeArticle.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!article) return jsonError("Not found", 404);

  try {
    await embedArticle(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(String(err), 500);
  }
});
