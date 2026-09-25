import { describe, it, expect } from "vitest";
import {
  getExpirationFlag,
  getExpiringDocuments,
  getAlertEligibleDocuments,
  EXPIRATION_WARNING_DAYS,
} from "./expiration";
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

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

describe("getExpirationFlag", () => {
  it("returns none when there is no expiration date", () => {
    expect(getExpirationFlag(makeDoc({ expiration_date: null }))).toBe("none");
  });

  it("returns expired for a past date", () => {
    expect(getExpirationFlag(makeDoc({ expiration_date: daysFromNow(-5) }))).toBe("expired");
  });

  it("returns expiring_soon within the warning window", () => {
    const flag = getExpirationFlag(
      makeDoc({ expiration_date: daysFromNow(EXPIRATION_WARNING_DAYS - 1) })
    );
    expect(flag).toBe("expiring_soon");
  });

  it("returns none for a date well beyond the warning window", () => {
    const flag = getExpirationFlag(
      makeDoc({ expiration_date: daysFromNow(EXPIRATION_WARNING_DAYS + 30) })
    );
    expect(flag).toBe("none");
  });
});

describe("getExpiringDocuments", () => {
  it("filters to only expired and expiring_soon documents", () => {
    const docs = [
      makeDoc({ id: 1, expiration_date: daysFromNow(-1) }),
      makeDoc({ id: 2, expiration_date: daysFromNow(5) }),
      makeDoc({ id: 3, expiration_date: daysFromNow(100) }),
      makeDoc({ id: 4, expiration_date: null }),
    ];
    const result = getExpiringDocuments(docs);
    expect(result.map((d) => d.id)).toEqual([1, 2]);
  });
});

describe("getAlertEligibleDocuments", () => {
  it("excludes documents that already have an alert_sent_at", () => {
    const docs = [
      makeDoc({ id: 1, expiration_date: daysFromNow(-1), alert_sent_at: null }),
      makeDoc({ id: 2, expiration_date: daysFromNow(-1), alert_sent_at: "2026-09-01T00:00:00.000Z" }),
    ];
    const result = getAlertEligibleDocuments(docs);
    expect(result.map((d) => d.id)).toEqual([1]);
  });
});
