/**
 * Shared formatting utilities for consistent display across the app.
 */

/**
 * Format a number as Thai Baht currency.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format minutes into a human-readable string (e.g. "15 นาที" or "2 ชม.").
 */
export function formatMinutes(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${Math.round(minutes)} นาที`;
  return `${Math.round(minutes / 60)} ชม.`;
}

/**
 * Format bytes into human-readable file size (e.g. "1.5 MB").
 */
export function formatFileSize(bytes: string | number): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
