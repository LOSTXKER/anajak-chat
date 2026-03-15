import { NextResponse } from "next/server";
import { requireAuth, searchParams, apiHandler } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import type { AiBotMode } from "@/lib/generated/prisma/client";

export const GET = apiHandler(async (request) => {
  const user = await requireAuth();

  const channelId = searchParams(request).get("channelId");

  const config = await prisma.aiBotConfig.findFirst({
    where: {
      orgId: user.orgId,
      channelId: channelId ?? null,
    },
  });

  if (!config) {
    return NextResponse.json({
      mode: "off",
      useBusinessHours: false,
      autoMode: "full_auto",
      manualMode: "confirm",
      persona: null,
      escalationMaxRounds: 5,
      escalationOnNegativeSentiment: true,
      escalationOnRefund: true,
      escalationOnLowConfidence: 0.5,
      greetingMessage: null,
      isActive: false,
    });
  }

  return NextResponse.json({
    ...config,
    escalationOnLowConfidence: Number(config.escalationOnLowConfidence),
  });
});

export const PUT = apiHandler(async (request) => {
  const user = await requireAuth();

  const body = await request.json() as {
    channelId?: string | null;
    mode?: AiBotMode;
    useBusinessHours?: boolean;
    autoMode?: AiBotMode;
    manualMode?: AiBotMode;
    persona?: string | null;
    escalationMaxRounds?: number;
    escalationOnNegativeSentiment?: boolean;
    escalationOnRefund?: boolean;
    escalationOnLowConfidence?: number;
    greetingMessage?: string | null;
    isActive?: boolean;
  };

  const channelId = body.channelId ?? null;

  const config = await prisma.aiBotConfig.upsert({
    where: {
      orgId_channelId: {
        orgId: user.orgId,
        channelId: channelId!,
      },
    },
    update: {
      ...(body.mode !== undefined ? { mode: body.mode } : {}),
      ...(body.useBusinessHours !== undefined ? { useBusinessHours: body.useBusinessHours } : {}),
      ...(body.autoMode !== undefined ? { autoMode: body.autoMode } : {}),
      ...(body.manualMode !== undefined ? { manualMode: body.manualMode } : {}),
      ...(body.persona !== undefined ? { persona: body.persona } : {}),
      ...(body.escalationMaxRounds !== undefined ? { escalationMaxRounds: body.escalationMaxRounds } : {}),
      ...(body.escalationOnNegativeSentiment !== undefined ? { escalationOnNegativeSentiment: body.escalationOnNegativeSentiment } : {}),
      ...(body.escalationOnRefund !== undefined ? { escalationOnRefund: body.escalationOnRefund } : {}),
      ...(body.escalationOnLowConfidence !== undefined ? { escalationOnLowConfidence: body.escalationOnLowConfidence } : {}),
      ...(body.greetingMessage !== undefined ? { greetingMessage: body.greetingMessage } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
    create: {
      orgId: user.orgId,
      channelId,
      mode: body.mode ?? "off",
      useBusinessHours: body.useBusinessHours ?? false,
      autoMode: body.autoMode ?? "full_auto",
      manualMode: body.manualMode ?? "confirm",
      persona: body.persona ?? null,
      escalationMaxRounds: body.escalationMaxRounds ?? 5,
      escalationOnNegativeSentiment: body.escalationOnNegativeSentiment ?? true,
      escalationOnRefund: body.escalationOnRefund ?? true,
      escalationOnLowConfidence: body.escalationOnLowConfidence ?? 0.5,
      greetingMessage: body.greetingMessage ?? null,
      isActive: body.isActive ?? false,
    },
  });

  return NextResponse.json({
    ...config,
    escalationOnLowConfidence: Number(config.escalationOnLowConfidence),
  });
});
