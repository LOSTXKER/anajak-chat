import { NextResponse } from "next/server";
import { requireAuth, apiHandler, jsonError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { META_GRAPH_BASE_URL } from "@/lib/constants";

const TEST_TIMEOUT = 8000;

async function testFacebook(credentials: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const token = credentials.pageAccessToken as string;
  if (!token) return { ok: false, error: "Missing pageAccessToken" };
  const res = await fetch(`${META_GRAPH_BASE_URL}/me?access_token=${token}`, {
    signal: AbortSignal.timeout(TEST_TIMEOUT),
  });
  if (!res.ok) return { ok: false, error: `Facebook API returned ${res.status}` };
  return { ok: true };
}

async function testInstagram(credentials: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const token = credentials.pageAccessToken as string;
  if (!token) return { ok: false, error: "Missing pageAccessToken" };
  const res = await fetch(`${META_GRAPH_BASE_URL}/me?access_token=${token}`, {
    signal: AbortSignal.timeout(TEST_TIMEOUT),
  });
  if (!res.ok) return { ok: false, error: `Instagram API returned ${res.status}` };
  return { ok: true };
}

async function testLine(credentials: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const token = credentials.channelAccessToken as string;
  if (!token) return { ok: false, error: "Missing channelAccessToken" };
  const res = await fetch("https://api.line.me/v2/bot/info", {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TEST_TIMEOUT),
  });
  if (!res.ok) return { ok: false, error: `LINE API returned ${res.status}` };
  return { ok: true };
}

async function testWhatsApp(credentials: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const token = credentials.accessToken as string;
  const phoneNumberId = credentials.phoneNumberId as string;
  if (!token || !phoneNumberId) return { ok: false, error: "Missing accessToken or phoneNumberId" };
  const res = await fetch(`${META_GRAPH_BASE_URL}/${phoneNumberId}?access_token=${token}`, {
    signal: AbortSignal.timeout(TEST_TIMEOUT),
  });
  if (!res.ok) return { ok: false, error: `WhatsApp API returned ${res.status}` };
  return { ok: true };
}

export const POST = apiHandler(async (_req, context) => {
  const user = await requireAuth();
  const { id } = await (context as { params: Promise<{ id: string }> }).params;

  const channel = await prisma.channel.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!channel) return jsonError("Channel not found", 404);

  const credentials = channel.credentials as Record<string, unknown>;
  let result: { ok: boolean; error?: string };

  try {
    switch (channel.platform) {
      case "facebook":
        result = await testFacebook(credentials);
        break;
      case "instagram":
        result = await testInstagram(credentials);
        break;
      case "line":
        result = await testLine(credentials);
        break;
      case "whatsapp":
        result = await testWhatsApp(credentials);
        break;
      default:
        result = { ok: false, error: `Unsupported platform: ${channel.platform}` };
    }
  } catch {
    result = { ok: false, error: "Connection timed out" };
  }

  return NextResponse.json(result);
});
