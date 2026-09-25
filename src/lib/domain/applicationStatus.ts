import type { DocumentRecord, ApplicationStatus } from "@/lib/types";

export const STALLED_THRESHOLD_DAYS = 5;

export function getApplicationStatus(documents: DocumentRecord[]): ApplicationStatus {
  if (documents.length === 0) return "Outstanding";

  const allApproved = documents.every((d) => d.status === "Approved");
  if (allApproved) return "Complete";

  const now = new Date();
  const isStalled = documents.some((d) => {
    if (d.status === "Approved") return false;
    if (!d.updated_at) return true; // never touched - treat as stalled
    const daysSinceUpdate = (now.getTime() - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate >= STALLED_THRESHOLD_DAYS;
  });

  return isStalled ? "Stalled" : "Outstanding";
}
