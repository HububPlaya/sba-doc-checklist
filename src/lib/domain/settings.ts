import { getDb } from "@/lib/db/client";

export function getAlertRecipientEmail(): string | null {
  const db = getDb();
  const row = db
    .prepare("SELECT alert_recipient_email FROM settings WHERE id = 1")
    .get() as { alert_recipient_email: string | null } | undefined;
  return row?.alert_recipient_email || null;
}

export function setAlertRecipientEmail(email: string): { success: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) {
    return { success: false, error: "Please provide a valid email address" };
  }

  const db = getDb();
  db.prepare(
    "INSERT INTO settings (id, alert_recipient_email) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET alert_recipient_email = excluded.alert_recipient_email"
  ).run(trimmed);

  return { success: true };
}
