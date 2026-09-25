import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDb } from "@/lib/db/client";

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth/auth";
import { POST } from "./route";

beforeEach(() => {
  const db = getDb();
  db.prepare(
    "INSERT INTO applications (id, business_name, borrower_name, loan_amount, application_date, assigned_processor) VALUES (?, ?, ?, ?, ?, ?)"
  ).run("APP-ARCHIVE-TEST", "Test Co", "Jane Doe", 100000, "2026-01-01", "Aisha Patel");
});

describe("POST /api/applications/[id]/archive", () => {
  it("returns 403 when the user is not a team_lead", async () => {
    (auth as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      user: { name: "Aisha Patel", role: "processor" },
    });

    const res = await POST(new Request("http://localhost", { method: "POST" }) as never, {
      params: Promise.resolve({ id: "APP-ARCHIVE-TEST" }),
    });
    expect(res.status).toBe(403);
  });

  it("archives the application when the user is a team_lead", async () => {
    (auth as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      user: { name: "Keelan Moore", role: "team_lead" },
    });

    const res = await POST(new Request("http://localhost", { method: "POST" }) as never, {
      params: Promise.resolve({ id: "APP-ARCHIVE-TEST" }),
    });
    expect(res.status).toBe(200);

    const db = getDb();
    const app = db
      .prepare("SELECT archived_at FROM applications WHERE id = ?")
      .get("APP-ARCHIVE-TEST") as { archived_at: string | null };
    expect(app.archived_at).toBeTruthy();
  });
});
