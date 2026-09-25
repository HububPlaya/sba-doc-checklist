import type { ImportRow, ImportSummary } from "@/lib/types";
import { getDb } from "@/lib/db/client";
import { ensureUserExists } from "./users";

const KNOWN_DOCUMENT_TYPES = new Set([
  "Bank Statements (90 day)",
  "Ownership Verification",
  "Articles of Incorporation",
  "Business Licenses & Permits",
]);

const REQUIRED_FIELDS: (keyof ImportRow)[] = ["application_id", "document_type"];

export function upsertRows(rows: ImportRow[]): ImportSummary {
  const db = getDb();
  const summary: ImportSummary = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    skippedRows: [],
    flaggedUnknownTypes: [],
  };

  const findExisting = db.prepare(
    "SELECT id FROM documents WHERE application_id = ? AND document_type = ?"
  );

  const insertApp = db.prepare(
    "INSERT INTO applications (id, business_name, borrower_name, loan_amount, application_date, assigned_processor) " +
      "VALUES (@application_id, @business_name, @borrower_name, @loan_amount, @application_date, @assigned_processor) " +
      "ON CONFLICT(id) DO UPDATE SET " +
      "business_name = excluded.business_name, " +
      "borrower_name = excluded.borrower_name, " +
      "loan_amount = excluded.loan_amount, " +
      "application_date = excluded.application_date, " +
      "assigned_processor = excluded.assigned_processor"
  );

  const insertDoc = db.prepare(
    "INSERT INTO documents (application_id, document_type, status, date_received, expiration_date, notes) " +
      "VALUES (@application_id, @document_type, @document_status, @date_received, @expiration_date, @notes)"
  );

  // Protected fields (status, notes, updated_by, updated_at) deliberately NOT in this UPDATE
  const updateDocSourceFields = db.prepare(
    "UPDATE documents SET expiration_date = @expiration_date " +
      "WHERE application_id = @application_id AND document_type = @document_type"
  );

  rows.forEach((row, index) => {
    for (const field of REQUIRED_FIELDS) {
      if (!row[field]) {
        summary.skipped++;
        summary.skippedRows.push({ row: index + 1, reason: "Missing " + field });
        return;
      }
    }

    if (!KNOWN_DOCUMENT_TYPES.has(row.document_type)) {
      summary.flaggedUnknownTypes.push(row.document_type);
    }

    if (row.assigned_processor) {
      ensureUserExists(row.assigned_processor);
    }

    insertApp.run({
      application_id: row.application_id,
      business_name: row.business_name,
      borrower_name: row.borrower_name,
      loan_amount: Number(row.loan_amount) || 0,
      application_date: row.application_date,
      assigned_processor: row.assigned_processor,
    });

    const existing = findExisting.get(row.application_id, row.document_type);
    if (existing) {
      updateDocSourceFields.run({
        application_id: row.application_id,
        document_type: row.document_type,
        expiration_date: row.expiration_date || null,
      });
      summary.updated++;
    } else {
      insertDoc.run({
        application_id: row.application_id,
        document_type: row.document_type,
        document_status: row.document_status || "Pending",
        date_received: row.date_received || null,
        expiration_date: row.expiration_date || null,
        notes: row.notes || null,
      });
      summary.inserted++;
    }
  });

  return summary;
}
