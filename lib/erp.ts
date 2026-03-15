import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { SyncLogType, SyncLogDirection, SyncLogStatus } from "@/lib/generated/prisma/client";

// ─── ERP Config ───────────────────────────────────────────────────────────────

export interface ErpConfig {
  erpBaseUrl: string;
  erpApiKey: string;
  erpWebhookSecret: string;
  erpEnabled: boolean;
}

export function getErpConfig(settings: unknown): ErpConfig | null {
  const s = settings as Record<string, unknown> | null;
  if (!s?.erpBaseUrl || !s?.erpApiKey) return null;
  return {
    erpBaseUrl: s.erpBaseUrl as string,
    erpApiKey: s.erpApiKey as string,
    erpWebhookSecret: (s.erpWebhookSecret as string) ?? "",
    erpEnabled: (s.erpEnabled as boolean) ?? true,
  };
}

// ─── ERP Fetch Wrapper ────────────────────────────────────────────────────────

export async function erpFetch(
  config: ErpConfig,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${config.erpBaseUrl.replace(/\/$/, "")}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.erpApiKey}`,
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

// ─── HMAC-SHA256 Verification ────────────────────────────────────────────────

export function verifyErpWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;
  const sig = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice(7)
    : signatureHeader;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ─── Sync Logger ─────────────────────────────────────────────────────────────

interface SyncLogParams {
  orgId: string;
  type: SyncLogType;
  direction: SyncLogDirection;
  status: SyncLogStatus;
  entityId?: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  errorMessage?: string;
}

export async function logSync(params: SyncLogParams) {
  try {
    await prisma.syncLog.create({
      data: {
        orgId: params.orgId,
        type: params.type,
        direction: params.direction,
        status: params.status,
        entityId: params.entityId ?? null,
        requestPayload: params.requestPayload != null
          ? (params.requestPayload as object)
          : undefined,
        responsePayload: params.responsePayload != null
          ? (params.responsePayload as object)
          : undefined,
        errorMessage: params.errorMessage ?? null,
      },
    });
  } catch {
    // Silently fail logging to not break main flow
  }
}

// ─── Order Status Message Templates ──────────────────────────────────────────

export const ORDER_STATUS_MESSAGES: Record<string, string> = {
  confirmed: "ออเดอร์ #{order_number} ได้รับการยืนยันแล้วค่ะ ขอบคุณที่สั่งซื้อ 🙏",
  shipped:
    "ออเดอร์ #{order_number} จัดส่งแล้วค่ะ! 🚚\nเลข Tracking: {tracking_number}\nติดตาม: {tracking_url}",
  delivered:
    "ออเดอร์ #{order_number} ส่งถึงแล้ว ขอบคุณที่อุดหนุนนะคะ 💖 หากมีข้อสงสัยทักมาได้เลยค่ะ",
  cancelled:
    "ออเดอร์ #{order_number} ถูกยกเลิกแล้วค่ะ หากมีข้อสงสัยกรุณาติดต่อทีมงานนะคะ",
};

export function buildOrderStatusMessage(
  status: string,
  vars: Record<string, string>
): string {
  let msg = ORDER_STATUS_MESSAGES[status] ?? `ออเดอร์ #{order_number} อัปเดตสถานะเป็น ${status}`;
  for (const [key, value] of Object.entries(vars)) {
    msg = msg.replaceAll(`{${key}}`, value);
  }
  return msg;
}
