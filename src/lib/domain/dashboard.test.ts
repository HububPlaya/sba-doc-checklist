import { describe, it, expect } from "vitest";
import { computePipelineSummary } from "./dashboard";
import type { Application, DocumentRecord } from "@/lib/types";

function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: "APP-1",
    business_name: "Test Business",
    borrower_name: "Test Borrower",
    loan_amount: 100000,
    application_date: "2026-01-01",
    assigned_processor: "Aisha Patel",
    archived_at: null,
    ...overrides,
  };
}

function makeDoc(overrides: Partial<DocumentRecord> = {}): DocumentRecord {
  return {
    id: 1,
    application_id: "APP-1",
    document_type: "Test Doc",
    status: "Pending",
    date_received: null,
    expiration_date: null,
    notes: null,
    updated_at: null,
    updated_by: null,
    alert_sent_at: null,
    ...overrides,
  };
}

describe("computePipelineSummary", () => {
  it("counts complete, outstanding, and stalled applications correctly", () => {
    const apps = [makeApp({ id: "A" }), makeApp({ id: "B" }), makeApp({ id: "C" })];
    const docsByApp = new Map([
      ["A", [makeDoc({ application_id: "A", status: "Approved" })]],
      [
        "B",
        [makeDoc({ application_id: "B", status: "Pending", updated_at: new Date().toISOString() })],
      ],
      ["C", [makeDoc({ application_id: "C", status: "Pending", updated_at: null })]],
    ]);

    const summary = computePipelineSummary(apps, docsByApp);
    expect(summary.complete).toBe(1);
    expect(summary.outstanding).toBe(1);
    expect(summary.stalled).toBe(1);
    expect(summary.stalledApplications).toHaveLength(1);
    expect(summary.stalledApplications[0].application.id).toBe("C");
  });

  it("excludes archived applications entirely", () => {
    const apps = [makeApp({ id: "A", archived_at: "2026-09-01T00:00:00.000Z" })];
    const docsByApp = new Map([["A", [makeDoc({ application_id: "A", status: "Pending" })]]]);

    const summary = computePipelineSummary(apps, docsByApp);
    expect(summary.complete + summary.outstanding + summary.stalled).toBe(0);
  });

  it("reports 0 days stalled when a document has never been updated", () => {
    const apps = [makeApp({ id: "A" })];
    const docsByApp = new Map([
      ["A", [makeDoc({ application_id: "A", status: "Pending", updated_at: null })]],
    ]);

    const summary = computePipelineSummary(apps, docsByApp);
    expect(summary.stalledApplications[0].daysStalled).toBe(0);
  });
});
