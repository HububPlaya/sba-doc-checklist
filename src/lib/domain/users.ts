import { getDb } from "@/lib/db/client";

export type UserRole = "processor" | "team_lead";

export interface UserRecord {
  name: string;
  role: UserRole;
}

export function listUsers(): UserRecord[] {
  const db = getDb();
  return db.prepare("SELECT name, role FROM users ORDER BY name").all() as UserRecord[];
}

export function ensureUserExists(name: string): void {
  if (!name || !name.trim()) return;
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO users (name, role) VALUES (?, 'processor')").run(name.trim());
}

export function setUserRole(
  name: string,
  role: string
): { success: boolean; error?: string } {
  if (role !== "processor" && role !== "team_lead") {
    return { success: false, error: "Invalid role" };
  }

  const db = getDb();
  const result = db.prepare("UPDATE users SET role = ? WHERE name = ?").run(role, name);

  if (result.changes === 0) {
    return { success: false, error: "User not found" };
  }

  return { success: true };
}
