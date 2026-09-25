import { Resend } from "resend";
import { renderAlertEmail, renderAlertCsv } from "./emailTemplate";
import { getDb } from "@/lib/db/client";
import { getAlertRecipientEmail } from "@/lib/domain/settings";

const resend = new Resend(process.env.RESEND_API_KEY);

type AlertDocument = {
  id: number;
  document_type: string;
  expiration_date: string | null;
  businessName: string;
};

export async function sendExpirationAlert(documents: AlertDocument[]) {
  console.log("[notifications] sendExpirationAlert called with", documents.length, "documents");

  if (documents.length === 0) {
    console.log("[notifications] no eligible documents, skipping send");
    return { skipped: true, reason: "no eligible documents" };
  }

  const recipient = getAlertRecipientEmail();
  if (!recipient) {
    console.log("[notifications] no alert recipient configured, skipping send");
    return { skipped: true, reason: "no recipient configured" };
  }

  const today = new Date().toISOString().split("T")[0];
  const csvContent = renderAlertCsv(documents);
  const csvBase64 = Buffer.from(csvContent, "utf-8").toString("base64");

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [recipient],
      subject:
        documents.length +
        " document" +
        (documents.length === 1 ? "" : "s") +
        " expiring soon - " +
        today,
      html: renderAlertEmail(documents),
      attachments: [
        {
          filename: "expiring-documents-" + today + ".csv",
          content: csvBase64,
        },
      ],
    });
    console.log("[notifications] email sent successfully to", recipient);
  } catch (err) {
    console.error("[notifications] failed to send email", err);
    return { skipped: false, sent: 0, error: "Failed to send email" };
  }

  const db = getDb();
  const stamp = db.prepare("UPDATE documents SET alert_sent_at = ? WHERE id = ?");
  const now = new Date().toISOString();
  documents.forEach((d) => stamp.run(now, d.id));

  console.log("[notifications] stamped alert_sent_at on", documents.length, "documents");
  return { skipped: false, sent: documents.length };
}