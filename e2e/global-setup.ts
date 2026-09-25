import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

async function globalSetup() {
  const dbPath = path.join(process.cwd(), "e2e-test.db");
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const db = new Database(dbPath);
  const schema = fs.readFileSync(path.join(process.cwd(), "src/lib/db/schema.sql"), "utf-8");
  db.exec(schema);

  db.prepare("INSERT INTO users (name, role) VALUES (?, 'team_lead')").run("E2E Test Lead");
  db.prepare("INSERT INTO users (name, role) VALUES (?, 'processor')").run("E2E Test Processor");

  db.prepare(
    "INSERT INTO applications (id, business_name, borrower_name, loan_amount, application_date, assigned_processor) VALUES (?, ?, ?, ?, ?, ?)"
  ).run("E2E-APP-1", "E2E Test Bakery", "Jane Tester", 100000, "2026-01-01", "E2E Test Processor");
  db.prepare(
    "INSERT INTO documents (application_id, document_type, status) VALUES (?, ?, ?)"
  ).run("E2E-APP-1", "Bank Statements (90 day)", "Pending");

  db.prepare(
    "INSERT INTO applications (id, business_name, borrower_name, loan_amount, application_date, assigned_processor) VALUES (?, ?, ?, ?, ?, ?)"
  ).run("E2E-APP-2", "E2E Archive Target Co", "John Tester", 75000, "2026-01-05", "E2E Test Processor");
  db.prepare(
    "INSERT INTO documents (application_id, document_type, status) VALUES (?, ?, ?)"
  ).run("E2E-APP-2", "Ownership Verification", "Pending");

  db.close();
  console.log("[e2e] test database seeded");
}

export default globalSetup;
