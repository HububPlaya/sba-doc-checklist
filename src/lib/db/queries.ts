import { getDb } from "./client";
import type { Application, DocumentRecord } from "@/lib/types";

export function getActiveApplications(): Application[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM applications WHERE archived_at IS NULL ORDER BY application_date DESC")
    .all() as Application[];
  return rows;
}

export function getDocumentsForApplications(applicationIds: string[]): DocumentRecord[] {
  if (applicationIds.length === 0) return [];
  const db = getDb();
  const placeholders = applicationIds.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT * FROM documents WHERE application_id IN (${placeholders})`)
    .all(...applicationIds) as DocumentRecord[];
  return rows;
}

export function groupDocumentsByApplication(
  documents: DocumentRecord[]
): Map<string, DocumentRecord[]> {
  const map = new Map<string, DocumentRecord[]>();
  for (const doc of documents) {
    const existing = map.get(doc.application_id) || [];
    existing.push(doc);
    map.set(doc.application_id, existing);
  }
  return map;
}
