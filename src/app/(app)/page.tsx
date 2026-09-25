"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { Application, DocumentRecord, ApplicationStatus } from "@/lib/types";
import type { ExpirationFlag } from "@/lib/domain/expiration";
import ApplicationsToolbar from "@/components/features/applications/ApplicationsToolbar";
import ApplicationsTable from "@/components/features/applications/ApplicationsTable";

type DocumentWithFlag = DocumentRecord & { expirationFlag: ExpirationFlag };
type ApplicationRow = Application & { status: ApplicationStatus; documents: DocumentWithFlag[] };

type SortKey = "business_name" | "assigned_processor" | "status" | "application_date";
type SortDirection = "asc" | "desc";

export default function HomePage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isTeamLead = role === "team_lead";

  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("application_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingDocId, setUpdatingDocId] = useState<number | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [bulkUpdatingId, setBulkUpdatingId] = useState<string | null>(null);

  function loadApplications() {
    console.log("[home] fetching applications");
    setIsLoading(true);
    fetch("/api/applications")
      .then(async (res) => {
        console.log("[home] fetch response status", res.status);
        if (!res.ok) throw new Error("Request failed: " + res.status);
        return res.json();
      })
      .then((data: ApplicationRow[]) => {
        console.log("[home] loaded " + data.length + " applications");
        setApplications(data);
        setLoadError("");
      })
      .catch((err) => {
        console.error("[home] failed to load applications", err);
        setLoadError("Could not load applications. Please refresh the page.");
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadApplications();
  }, []);

  function toggleSort(key: SortKey) {
    console.log("[home] sort toggled", { key });
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function toggleExpand(appId: string) {
    console.log("[home] row expand toggled", appId);
    setExpandedId((current) => (current === appId ? null : appId));
  }

  async function handleStatusChange(docId: number, newStatus: string) {
    console.log("[home] status change requested", { docId, newStatus });
    setUpdatingDocId(docId);

    try {
      const res = await fetch("/api/documents/" + docId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log("[home] status update response", res.status);

      if (!res.ok) {
        throw new Error("Update failed: " + res.status);
      }

      loadApplications();
    } catch (err) {
      console.error("[home] status update failed", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingDocId(null);
    }
  }

  async function handleBulkStatusChange(appId: string, docIds: number[], status: string) {
    console.log("[home] bulk status change requested", { appId, docIds, status });
    setBulkUpdatingId(appId);

    try {
      const res = await fetch("/api/documents/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: docIds, status }),
      });

      console.log("[home] bulk status change response", res.status);

      if (!res.ok) {
        throw new Error("Bulk update failed: " + res.status);
      }

      loadApplications();
    } catch (err) {
      console.error("[home] bulk status change failed", err);
      alert("Failed to update selected documents. Please try again.");
    } finally {
      setBulkUpdatingId(null);
    }
  }

  async function handleArchive(appId: string, businessName: string) {
    console.log("[home] archive requested", appId);
    const confirmed = window.confirm(
      "Archive " + businessName + "? This can be reversed later but will remove it from the active list."
    );
    if (!confirmed) {
      console.log("[home] archive cancelled by user");
      return;
    }

    setArchivingId(appId);
    try {
      const res = await fetch("/api/applications/" + appId + "/archive", {
        method: "POST",
      });

      console.log("[home] archive response", res.status);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Archive failed: " + res.status);
      }

      setExpandedId(null);
      loadApplications();
    } catch (err) {
      console.error("[home] archive failed", err);
      alert(err instanceof Error ? err.message : "Failed to archive application.");
    } finally {
      setArchivingId(null);
    }
  }

  const filteredAndSorted = useMemo(() => {
    let rows = applications;

    if (statusFilter !== "All") {
      rows = rows.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.business_name.toLowerCase().includes(q) ||
          r.borrower_name?.toLowerCase().includes(q) ||
          r.assigned_processor?.toLowerCase().includes(q)
      );
    }

    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "business_name") cmp = a.business_name.localeCompare(b.business_name);
      if (sortKey === "assigned_processor")
        cmp = (a.assigned_processor || "").localeCompare(b.assigned_processor || "");
      if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      if (sortKey === "application_date")
        cmp = (a.application_date || "").localeCompare(b.application_date || "");
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [applications, statusFilter, search, sortKey, sortDirection]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {applications.length} active application{applications.length === 1 ? "" : "s"}
          </p>
        </div>

        <ApplicationsToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading && (
            <div className="p-8 text-center text-sm text-slate-500">Loading applications...</div>
          )}

          {!isLoading && loadError && (
            <div className="p-8 text-center text-sm text-red-600">{loadError}</div>
          )}

          {!isLoading && !loadError && filteredAndSorted.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              No applications match your filters.
            </div>
          )}

          {!isLoading && !loadError && filteredAndSorted.length > 0 && (
            <ApplicationsTable
              applications={filteredAndSorted}
              expandedId={expandedId}
              onToggleExpand={toggleExpand}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
              isTeamLead={isTeamLead}
              updatingDocId={updatingDocId}
              bulkUpdatingId={bulkUpdatingId}
              archivingId={archivingId}
              onDocumentStatusChange={handleStatusChange}
              onBulkStatusChange={handleBulkStatusChange}
              onArchive={handleArchive}
            />
          )}
        </div>
      </div>
    </div>
  );
}
