import { getDb } from "@/lib/db/client";
import type { UserRole } from "@/lib/types";

export function archiveApplication(applicationId: string, actorRole: UserRole): { success: boolean; error?: string } {
  if (actorRole !== "team_lead") {
    return { success: false, error: "Only a team lead can archive an application." };
  }

  const db = getDb();
  db.prepare("UPDATE applications SET archived_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    applicationId
  );

  return { success: true };
}
