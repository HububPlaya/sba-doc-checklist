import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Configurable path so tests can point this at an isolated file or :memory:
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const isNew = DB_PATH === ":memory:" || !fs.existsSync(DB_PATH);
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  if (isNew) {
    const schema = fs.readFileSync(path.join(process.cwd(), "src/lib/db/schema.sql"), "utf-8");
    db.exec(schema);
  }

  return db;
}

// Test helper - forces a fresh connection (used between test files)
export function resetDbConnection() {
  db?.close();
  db = null;
}
