import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("orgId");
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!orgId || !sessionId) {
    return NextResponse.json({ messages: [] });
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } });
  if (!org) {
    return NextResponse.json({ error: "Invalid organization" }, { status: 403 });
  }

  const contact = await prisma.contact.findFirst({
    where: { orgId, platformId: sessionId, platform: "web" },
  });

  if (!contact) return NextResponse.json({ messages: [] });

  const conversation = await prisma.conversation.findFirst({
    where: { orgId, contactId: contact.id, status: { in: ["open", "pending"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!conversation) return NextResponse.json({ messages: [] });

  const since = request.nextUrl.searchParams.get("since");
  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      senderType: true,
      content: true,
      contentType: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ messages, conversationId: conversation.id });
}
