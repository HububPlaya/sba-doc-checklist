import type { Application, DocumentRecord } from "@/lib/types";
import { getApplicationStatus } from "./applicationStatus";

export interface PipelineSummary {
  complete: number;
  outstanding: number;
  stalled: number;
  stalledApplications: { application: Application; daysStalled: number }[];
}

export function computePipelineSummary(
  applications: Application[],
  documentsByAppId: Map<string, DocumentRecord[]>
): PipelineSummary {
  const summary: PipelineSummary = { complete: 0, outstanding: 0, stalled: 0, stalledApplications: [] };

  for (const app of applications) {
    if (app.archived_at) continue;
    const docs = documentsByAppId.get(app.id) || [];
    const status = getApplicationStatus(docs);

    if (status === "Complete") summary.complete++;
    if (status === "Outstanding") summary.outstanding++;
    if (status === "Stalled") {
      summary.stalled++;
      const oldestUpdate = docs.reduce((oldest, d) => {
        if (!d.updated_at) return oldest;
        const t = new Date(d.updated_at).getTime();
        return t < oldest ? t : oldest;
      }, Date.now());
      const daysStalled = Math.floor((Date.now() - oldestUpdate) / (1000 * 60 * 60 * 24));
      summary.stalledApplications.push({ application: app, daysStalled });
    }
  }

  return summary;
}
