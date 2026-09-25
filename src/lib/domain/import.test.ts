import { describe, it, expect } from "vitest";
import { upsertRows } from "./import";
import { getDb } from "@/lib/db/client";
import type { ImportRow } from "@/lib/types";

function makeRow(overrides: Partial<ImportRow> = {}): ImportRow {
  return {
    application_id: "APP-TEST-1",
    business_name: "Test Co",
    borrower_name: "Jane Doe",
    loan_amount: "100000",
    application_date: "2026-01-01",
    assigned_processor: "Aisha Patel",
    document_type: "Bank Statements (90 day)",
    document_status: "Pending",
    date_received: "",
    expiration_date: "",
    notes: "",
    ...overrides,
  };
}

describe("upsertRows", () => {
  it("inserts a new application and document", () => {
    const summary = upsertRows([makeRow()]);
    expect(summary.inserted).toBe(1);
    expect(summary.updated).toBe(0);
    expect(summary.skipped).toBe(0);

    const db = getDb();
    const app = db.prepare("SELECT * FROM applications WHERE id = ?").get("APP-TEST-1");
    expect(app).toBeTruthy();
  });

  it("skips rows missing required fields and records the reason", () => {
    const summary = upsertRows([makeRow({ application_id: "" })]);
    expect(summary.skipped).toBe(1);
    expect(summary.inserted).toBe(0);
    expect(summary.skippedRows[0].reason).toContain("application_id");
  });

  it("flags unknown document types but still imports them", () => {
    const summary = upsertRows([makeRow({ document_type: "Some Totally New Form" })]);
    expect(summary.flaggedUnknownTypes).toContain("Some Totally New Form");
    expect(summary.inserted).toBe(1);
  });

  it("on re-import, updates source fields but never overwrites status set by a user", () => {
    upsertRows([makeRow({ expiration_date: "2026-06-01" })]);

    const db = getDb();
    db.prepare(
      "UPDATE documents SET status = 'Approved', updated_by = 'Aisha Patel' WHERE application_id = ? AND document_type = ?"
    ).run("APP-TEST-1", "Bank Statements (90 day)");

    const summary = upsertRows([makeRow({ expiration_date: "2026-12-01" })]);
    expect(summary.updated).toBe(1);
    expect(summary.inserted).toBe(0);

    const doc = db
      .prepare("SELECT * FROM documents WHERE application_id = ? AND document_type = ?")
      .get("APP-TEST-1", "Bank Statements (90 day)") as { status: string; expiration_date: string };

    expect(doc.status).toBe("Approved");
    expect(doc.expiration_date).toBe("2026-12-01");
  });
});
