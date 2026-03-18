import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { segmentContact } from "@/lib/gemini";

export const POST = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { contactId } = await (context as { params: Promise<{ contactId: string }> }).params;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, orgId: user.orgId },
  });
  if (!contact) return jsonError("Contact not found", 404);

  const conversations = await prisma.conversation.findMany({
    where: { contactId, orgId: user.orgId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { aiSummary: true },
  });

  const result = await segmentContact({
    contactProfile: {
      name: contact.displayName,
      segment: contact.segment,
      totalOrders: contact.totalOrders,
      platform: contact.platform,
    },
    conversationSummaries: conversations
      .map((c) => c.aiSummary)
      .filter((s): s is string => !!s),
    orderCount: contact.totalOrders,
    totalRevenue: Number(contact.totalRevenue),
  });

  await prisma.contact.update({
    where: { id: contactId },
    data: { segment: result.segment },
  });

  return NextResponse.json(result);
});
