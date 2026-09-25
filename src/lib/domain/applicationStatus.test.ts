import { describe, it, expect } from "vitest";
import { getApplicationStatus, STALLED_THRESHOLD_DAYS } from "./applicationStatus";
import type { DocumentRecord } from "@/lib/types";

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

describe("getApplicationStatus", () => {
  it("returns Outstanding when there are no documents", () => {
    expect(getApplicationStatus([])).toBe("Outstanding");
  });

  it("returns Complete when every document is Approved", () => {
    const docs = [makeDoc({ status: "Approved" }), makeDoc({ id: 2, status: "Approved" })];
    expect(getApplicationStatus(docs)).toBe("Complete");
  });

  it("returns Outstanding when a non-approved document was updated recently", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 1);
    const docs = [makeDoc({ status: "Pending", updated_at: recent.toISOString() })];
    expect(getApplicationStatus(docs)).toBe("Outstanding");
  });

  it("returns Stalled when a document has not moved past the threshold", () => {
    const old = new Date();
    old.setDate(old.getDate() - (STALLED_THRESHOLD_DAYS + 1));
    const docs = [makeDoc({ status: "Pending", updated_at: old.toISOString() })];
    expect(getApplicationStatus(docs)).toBe("Stalled");
  });

  it("returns Stalled when a document has never been touched", () => {
    const docs = [makeDoc({ status: "Pending", updated_at: null })];
    expect(getApplicationStatus(docs)).toBe("Stalled");
  });

  it("returns Outstanding when at least one non-approved document is recently updated", () => {
    const recent = new Date();
    recent.setHours(recent.getHours() - 1);
    const docs = [
      makeDoc({ id: 1, status: "Approved" }),
      makeDoc({ id: 2, status: "Under Review", updated_at: recent.toISOString() }),
    ];
    expect(getApplicationStatus(docs)).toBe("Outstanding");
  });
});
