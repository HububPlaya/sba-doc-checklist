import { describe, it, expect, beforeEach } from "vitest";
import { archiveApplication } from "./archive";
import { getDb } from "@/lib/db/client";

beforeEach(() => {
  const db = getDb();
  db.prepare(
    "INSERT INTO applications (id, business_name, borrower_name, loan_amount, application_date, assigned_processor) VALUES (?, ?, ?, ?, ?, ?)"
  ).run("APP-ARCHIVE-1", "Test Co", "Jane Doe", 100000, "2026-01-01", "Aisha Patel");
});

describe("archiveApplication", () => {
  it("allows a team_lead to archive an application", () => {
    const result = archiveApplication("APP-ARCHIVE-1", "team_lead");
    expect(result.success).toBe(true);

    const db = getDb();
    const app = db
      .prepare("SELECT archived_at FROM applications WHERE id = ?")
      .get("APP-ARCHIVE-1") as { archived_at: string | null };
    expect(app.archived_at).toBeTruthy();
  });

  it("denies a processor from archiving an application", () => {
    const result = archiveApplication("APP-ARCHIVE-1", "processor");
    expect(result.success).toBe(false);
    expect(result.error).toContain("team lead");

    const db = getDb();
    const app = db
      .prepare("SELECT archived_at FROM applications WHERE id = ?")
      .get("APP-ARCHIVE-1") as { archived_at: string | null };
    expect(app.archived_at).toBeNull();
  });
});
