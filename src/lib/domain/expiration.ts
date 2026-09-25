import type { DocumentRecord } from "@/lib/types";

export const EXPIRATION_WARNING_DAYS = 14;

export type ExpirationFlag = "expired" | "expiring_soon" | "none";

export function getExpirationFlag(document: DocumentRecord): ExpirationFlag {
  if (!document.expiration_date) return "none";
  const now = new Date();
  const expDate = new Date(document.expiration_date);
  const daysUntilExpiration = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilExpiration < 0) return "expired";
  if (daysUntilExpiration <= EXPIRATION_WARNING_DAYS) return "expiring_soon";
  return "none";
}

export function getExpiringDocuments(documents: DocumentRecord[]): DocumentRecord[] {
  return documents.filter((d) => getExpirationFlag(d) !== "none");
}

// Only documents not yet alerted on - feeds the email trigger's dedup logic
export function getAlertEligibleDocuments(documents: DocumentRecord[]): DocumentRecord[] {
  return getExpiringDocuments(documents).filter((d) => !d.alert_sent_at);
}
