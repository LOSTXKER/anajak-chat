export interface DaySchedule {
  enabled: boolean;
  openTime: string;  // "HH:MM"
  closeTime: string; // "HH:MM"
}

export interface BusinessHoursConfig {
  timezone: string;
  schedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  holidays: Array<{ date: string; name: string }>; // date: "YYYY-MM-DD"
  autoReplyMessage: string;
  afterHoursBehavior: "auto_reply_only" | "ai_bot";
}

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  timezone: "Asia/Bangkok",
  schedule: {
    monday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
    tuesday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
    wednesday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
    thursday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
    friday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
    saturday: { enabled: false, openTime: "09:00", closeTime: "12:00" },
    sunday: { enabled: false, openTime: "09:00", closeTime: "12:00" },
  },
  holidays: [],
  autoReplyMessage:
    "ขอบคุณที่ทักมานะคะ ตอนนี้อยู่นอกเวลาทำการ ทีมงานจะตอบกลับโดยเร็วที่สุดค่ะ",
  afterHoursBehavior: "auto_reply_only",
};

export function isWithinBusinessHours(config: BusinessHoursConfig): boolean {
  try {
    const now = new Date();
    const tzNow = new Date(now.toLocaleString("en-US", { timeZone: config.timezone }));

    const dateStr = tzNow.toISOString().split("T")[0];
    // Check holidays
    if (config.holidays.some((h) => h.date === dateStr)) return false;

    const dayKey = DAY_KEYS[tzNow.getDay()];
    const daySchedule = config.schedule[dayKey];
    if (!daySchedule.enabled) return false;

    const currentMinutes = tzNow.getHours() * 60 + tzNow.getMinutes();
    const [openH, openM] = daySchedule.openTime.split(":").map(Number);
    const [closeH, closeM] = daySchedule.closeTime.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } catch {
    return true; // default to open on error
  }
}

export function getNextOpenTime(config: BusinessHoursConfig): Date | null {
  try {
    const now = new Date();
    const tzNow = new Date(now.toLocaleString("en-US", { timeZone: config.timezone }));

    // Search up to 8 days ahead
    for (let i = 0; i < 8; i++) {
      const check = new Date(tzNow);
      check.setDate(tzNow.getDate() + i);

      const dateStr = check.toISOString().split("T")[0];
      if (config.holidays.some((h) => h.date === dateStr)) continue;

      const dayKey = DAY_KEYS[check.getDay()];
      const daySchedule = config.schedule[dayKey];
      if (!daySchedule.enabled) continue;

      const [openH, openM] = daySchedule.openTime.split(":").map(Number);

      const openDate = new Date(check);
      openDate.setHours(openH, openM, 0, 0);

      if (openDate > tzNow || i > 0) return openDate;
    }

    return null;
  } catch {
    return null;
  }
}

export function extractBusinessHours(
  settings: unknown
): BusinessHoursConfig {
  const s = settings as Record<string, unknown> | null;
  if (!s?.businessHours) return DEFAULT_BUSINESS_HOURS;
  return { ...DEFAULT_BUSINESS_HOURS, ...(s.businessHours as Partial<BusinessHoursConfig>) };
}
