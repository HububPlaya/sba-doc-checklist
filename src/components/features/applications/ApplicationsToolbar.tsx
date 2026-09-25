"use client";

import type { ApplicationStatus } from "@/lib/types";

export default function ApplicationsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ApplicationStatus | "All";
  onStatusFilterChange: (value: ApplicationStatus | "All") => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        placeholder="Search business, borrower, or processor..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as ApplicationStatus | "All")}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      >
        <option value="All">All statuses</option>
        <option value="Complete">Complete</option>
        <option value="Outstanding">Outstanding</option>
        <option value="Stalled">Stalled</option>
      </select>
    </div>
  );
}
