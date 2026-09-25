import { getDb } from "@/lib/db/client";
import type { DocumentStatus } from "@/lib/types";

const VALID_STATUSES: DocumentStatus[] = [
  "Pending",
  "Received",
  "Under Review",
  "Approved",
  "Rejected",
];

export function updateDocumentStatus(
  id: number,
  status: string,
  updatedBy: string
): { success: boolean; error?: string } {
  if (!VALID_STATUSES.includes(status as DocumentStatus)) {
    return { success: false, error: "Invalid status: " + status };
  }

  const db = getDb();
  const result = db
    .prepare("UPDATE documents SET status = ?, updated_at = ?, updated_by = ? WHERE id = ?")
    .run(status, new Date().toISOString(), updatedBy, id);

  if (result.changes === 0) {
    return { success: false, error: "Document not found" };
  }

  return { success: true };
}

export function bulkUpdateDocumentStatusByIds(
  ids: number[],
  status: string,
  updatedBy: string
): { success: boolean; error?: string; count?: number } {
  if (!VALID_STATUSES.includes(status as DocumentStatus)) {
    return { success: false, error: "Invalid status: " + status };
  }

  if (ids.length === 0) {
    return { success: false, error: "No documents selected" };
  }

  const db = getDb();
  const stmt = db.prepare(
    "UPDATE documents SET status = ?, updated_at = ?, updated_by = ? WHERE id = ?"
  );
  const now = new Date().toISOString();

  const runMany = db.transaction((docIds: number[]) => {
    let count = 0;
    for (const id of docIds) {
      const result = stmt.run(status, now, updatedBy, id);
      count += result.changes;
    }
    return count;
  });

  const count = runMany(ids);
  return { success: true, count };
}
