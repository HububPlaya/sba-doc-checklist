"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { PipelineSummary } from "@/lib/domain/dashboard";
import type { DocumentRecord } from "@/lib/types";
import AlertSettingsPanel from "@/components/features/dashboard/AlertSettingsPanel";
import TeamPanel from "@/components/features/dashboard/TeamPanel";

type ExpiringDoc = DocumentRecord & { businessName: string };
type DashboardData = { summary: PipelineSummary; expiringDocs: ExpiringDoc[] };

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isTeamLead = role === "team_lead";

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("[dashboard] fetching summary");
    fetch("/api/dashboard")
      .then(async (res) => {
        console.log("[dashboard] fetch response status", res.status);
        if (!res.ok) throw new Error("Request failed: " + res.status);
        return res.json();
      })
      .then((result: DashboardData) => {
        console.log("[dashboard] loaded", {
          stalled: result.summary.stalled,
          expiring: result.expiringDocs.length,
        });
        setData(result);
      })
      .catch((err) => {
        console.error("[dashboard] failed to load", err);
        setError("Could not load dashboard. Please refresh the page.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Pipeline overview and items needing attention</p>
        </div>

        <TeamPanel isTeamLead={isTeamLead} />
        <AlertSettingsPanel isTeamLead={isTeamLead} />

        {isLoading && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-500">
            Loading dashboard...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Complete" value={data.summary.complete} tone="green" />
              <StatCard label="Outstanding" value={data.summary.outstanding} tone="slate" />
              <StatCard label="Stalled" value={data.summary.stalled} tone="red" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">
                  Stalled applications
                  {data.summary.stalledApplications.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      ({data.summary.stalledApplications.length})
                    </span>
                  )}
                </h2>
                {data.summary.stalledApplications.length === 0 ? (
                  <p className="text-sm text-slate-500">Nothing is currently stalled.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {data.summary.stalledApplications
                      .sort((a, b) => b.daysStalled - a.daysStalled)
                      .map(({ application, daysStalled }) => (
                        <div
                          key={application.id}
                          className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {application.business_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {application.assigned_processor}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-red-700 shrink-0 ml-2">
                            {daysStalled > 0 ? daysStalled + "d stalled" : "Never updated"}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">
                  Expiring soon
                  {data.expiringDocs.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      ({data.expiringDocs.length})
                    </span>
                  )}
                </h2>
                {data.expiringDocs.length === 0 ? (
                  <p className="text-sm text-slate-500">No documents expiring or expired.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {data.expiringDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {doc.businessName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{doc.document_type}</p>
                        </div>
                        <span className="text-xs font-medium text-amber-700 shrink-0 ml-2">
                          {doc.expiration_date}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "slate" | "red";
}) {
  const stylesMap = {
    green: "bg-green-50 border-green-200 text-green-700",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  const styles = stylesMap[tone];

  return (
    <div className={"rounded-xl border p-4 " + styles}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs font-medium mt-1">{label}</p>
    </div>
  );
}
