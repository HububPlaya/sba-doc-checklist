import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDb } from "@/lib/db/client";

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth/auth";
import { PATCH } from "./route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/documents/1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  const db = getDb();
  db.prepare(
    "INSERT INTO applications (id, business_name, borrower_name, loan_amount, application_date, assigned_processor) VALUES (?, ?, ?, ?, ?, ?)"
  ).run("APP-1", "Test Co", "Jane Doe", 100000, "2026-01-01", "Aisha Patel");
  db.prepare(
    "INSERT INTO documents (id, application_id, document_type, status) VALUES (1, 'APP-1', 'Bank Statements (90 day)', 'Pending')"
  ).run();
});

describe("PATCH /api/documents/[id]", () => {
  it("returns 401 when there is no session", async () => {
    (auth as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(null);

    const res = await PATCH(makeRequest({ status: "Approved" }) as never, {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(401);
  });

  it("updates the document status when authenticated", async () => {
    (auth as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      user: { name: "Aisha Patel", role: "processor" },
    });

    const res = await PATCH(makeRequest({ status: "Approved" }) as never, {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(200);

    const db = getDb();
    const doc = db.prepare("SELECT status FROM documents WHERE id = 1").get() as { status: string };
    expect(doc.status).toBe("Approved");
  });
});
