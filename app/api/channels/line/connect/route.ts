import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateLineCredentials } from "@/lib/integrations/line";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId, channelSecret, channelAccessToken, name } = await request.json();

  if (!channelId || !channelSecret || !channelAccessToken) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validation = await validateLineCredentials({
    channelId,
    channelSecret,
    channelAccessToken,
  });

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error ?? "Invalid credentials" }, { status: 400 });
  }

  const existing = await prisma.channel.findFirst({
    where: {
      orgId: user.orgId,
      platform: "line",
      credentials: { path: ["channelId"], equals: channelId },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "This LINE channel is already connected" }, { status: 409 });
  }

  const channel = await prisma.channel.create({
    data: {
      orgId: user.orgId,
      platform: "line",
      name: name || validation.botName || "LINE OA",
      credentials: {
        channelId,
        channelSecret,
        channelAccessToken,
      },
      isActive: true,
    },
    select: { id: true, platform: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(channel, { status: 201 });
}
