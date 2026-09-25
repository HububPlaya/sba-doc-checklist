import { describe, it, expect } from "vitest";
import { getDb } from "@/lib/db/client";
import { POST } from "./route";

const CSV_CONTENT =
  "application_id,business_name,borrower_name,loan_amount,application_date,assigned_processor,document_type,document_status,date_received,expiration_date,notes\n" +
  "APP-IMPORT-TEST,Test Co,Jane Doe,100000,2026-01-01,Aisha Patel,Bank Statements (90 day),Pending,,,\n";

function makeRequest(): Request {
  const formData = new FormData();
  const file = new File([CSV_CONTENT], "test.csv", { type: "text/csv" });
  formData.append("file", file);
  return new Request("http://localhost/api/import", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/import", () => {
  it("parses the CSV and inserts a new application", async () => {
    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.inserted).toBe(1);

    const db = getDb();
    const app = db.prepare("SELECT * FROM applications WHERE id = ?").get("APP-IMPORT-TEST");
    expect(app).toBeTruthy();
  });

  it("returns 400 when no file is provided", async () => {
    const formData = new FormData();
    const req = new Request("http://localhost/api/import", { method: "POST", body: formData });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });
});
