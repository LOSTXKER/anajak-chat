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
  pending: { label: "รอรับ", className: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  open: { label: "กำลังดูแล", className: "bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  resolved: { label: "เสร็จสิ้น", className: "bg-zinc-100 text-zinc-500 dark:bg-card dark:text-muted-foreground/70" },
};

// ─── Conversation Label Badges ────────────────────────────────────────────────
export const LABEL_BADGE: Record<string, { label: string; className: string }> = {
  missed: { label: "ไม่ได้รับ", className: "bg-orange-100/80 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  follow_up: { label: "ติดตาม", className: "bg-violet-100/80 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
  spam: { label: "สแปม", className: "bg-red-100/80 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  blocked: { label: "บล็อก", className: "bg-zinc-200 text-zinc-600 dark:bg-muted dark:text-muted-foreground" },
};

// ─── Default SLA Config ──────────────────────────────────────────────────────
export const DEFAULT_SLA_CONFIG = {
  priority: "medium" as const,
  responseMinutes: 15,
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

// ─── Platform Badge Colors ────────────────────────────────────────────────────
const PLATFORM_BADGE_BASE = "bg-zinc-100 text-zinc-600 dark:bg-card dark:text-muted-foreground";
export const PLATFORM_BADGE_COLORS: Record<string, string> = {
  facebook: PLATFORM_BADGE_BASE,
  instagram: PLATFORM_BADGE_BASE,
  line: PLATFORM_BADGE_BASE,
  whatsapp: PLATFORM_BADGE_BASE,
  web: PLATFORM_BADGE_BASE,
  manual: PLATFORM_BADGE_BASE,
};
export const PLATFORM_BADGE_FALLBACK = "bg-gray-100 text-gray-700 dark:bg-card dark:text-muted-foreground";
