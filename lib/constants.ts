// ─── Meta / Facebook Graph API ────────────────────────────────────────────────
export const META_GRAPH_API_VERSION = "v21.0";
export const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;
export const META_IG_GRAPH_BASE_URL = `https://graph.instagram.com/${META_GRAPH_API_VERSION}`;

// ─── Timeouts ─────────────────────────────────────────────────────────────────
export const ERP_REQUEST_TIMEOUT = 8000;
export const ERP_TEST_TIMEOUT = 5000;
export const AI_BOT_ERP_TIMEOUT = 3000;

// ─── SLA ──────────────────────────────────────────────────────────────────────
export const SLA_WARNING_THRESHOLD_PERCENT = 20;

// ─── Conversation Status Badges ───────────────────────────────────────────────
export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "รอรับ", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  open: { label: "กำลังดูแล", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  resolved: { label: "เสร็จสิ้น", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  closed: { label: "ปิด", className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300" },
};

// ─── Conversation Label Badges ────────────────────────────────────────────────
export const LABEL_BADGE: Record<string, { label: string; className: string }> = {
  missed: { label: "ไม่ได้รับ", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  follow_up: { label: "ติดตาม", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  spam: { label: "สแปม", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  blocked: { label: "บล็อก", className: "bg-zinc-300 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-100" },
};

// ─── Default Roles ────────────────────────────────────────────────────────────
export const DEFAULT_ROLES = [
  { name: "owner", description: "Owner — full access", permissions: ["*"], isSystemRole: true },
  { name: "admin", description: "Admin — manage team, settings, reports", permissions: ["chat:view_all", "chat:assign", "chat:transfer", "contacts:view", "contacts:edit", "analytics:view", "settings:view", "settings:edit", "team:view", "team:invite"], isSystemRole: true },
  { name: "supervisor", description: "Supervisor — oversee team chats", permissions: ["chat:view_all", "chat:assign", "chat:transfer", "contacts:view", "contacts:edit", "analytics:view"], isSystemRole: true },
  { name: "agent", description: "Agent — handle assigned chats", permissions: ["chat:view_assigned", "chat:reply", "contacts:view", "contacts:edit"], isSystemRole: true },
] as const;

// ─── Conversation Event Labels ─────────────────────────────────────────────────
export const EVENT_LABELS: Record<string, string> = {
  session_started: "เริ่มแชท",
  resolved: "เสร็จสิ้น",
  assigned: "มอบหมายให้",
  transferred: "โอนแชทให้",
  follow_up: "ติดตาม",
  marked_spam: "กำหนดเป็นสแปม",
  blocked: "บล็อก",
  sla_escalated: "SLA Escalated",
  sla_breach: "SLA Breach",
};
