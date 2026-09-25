"use client";

import { Fragment } from "react";
import type { Application, DocumentRecord, ApplicationStatus } from "@/lib/types";
import type { ExpirationFlag } from "@/lib/domain/expiration";
import StatusBadge from "@/components/ui/StatusBadge";
import ExpirationDot, { worstExpirationFlag } from "@/components/ui/ExpirationDot";
import DocumentDetailPanel from "./DocumentDetailPanel";

type DocumentWithFlag = DocumentRecord & { expirationFlag: ExpirationFlag };
type ApplicationRow = Application & { status: ApplicationStatus; documents: DocumentWithFlag[] };

type SortKey = "business_name" | "assigned_processor" | "status" | "application_date";
type SortDirection = "asc" | "desc";

export default function ApplicationsTable({
  applications,
  expandedId,
  onToggleExpand,
  sortKey,
  sortDirection,
  onSort,
  isTeamLead,
  updatingDocId,
  bulkUpdatingId,
  archivingId,
  onDocumentStatusChange,
  onBulkStatusChange,
  onArchive,
}: {
  applications: ApplicationRow[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  isTeamLead: boolean;
  updatingDocId: number | null;
  bulkUpdatingId: string | null;
  archivingId: string | null;
  onDocumentStatusChange: (docId: number, status: string) => void;
  onBulkStatusChange: (appId: string, docIds: number[], status: string) => void;
  onArchive: (appId: string, businessName: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 w-2">
              <span className="sr-only">Alerts</span>
            </th>
            <th className="px-4 py-3 w-2">
              <span className="sr-only">Expand</span>
            </th>
            <SortableHeader
              label="Business"
              active={sortKey === "business_name"}
              direction={sortDirection}
              onClick={() => onSort("business_name")}
            />
            <th className="px-4 py-3">Borrower</th>
            <SortableHeader
              label="Processor"
              active={sortKey === "assigned_processor"}
              direction={sortDirection}
              onClick={() => onSort("assigned_processor")}
            />
            <SortableHeader
              label="Status"
              active={sortKey === "status"}
              direction={sortDirection}
              onClick={() => onSort("status")}
            />
            <SortableHeader
              label="Date"
              active={sortKey === "application_date"}
              direction={sortDirection}
              onClick={() => onSort("application_date")}
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((app) => {
            const flag = worstExpirationFlag(app.documents);
            const isExpanded = expandedId === app.id;
            return (
              <Fragment key={app.id}>
                <tr
                  onClick={() => onToggleExpand(app.id)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <ExpirationDot flag={flag} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">{isExpanded ? "v" : ">"}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{app.business_name}</td>
                  <td className="px-4 py-3 text-slate-600">{app.borrower_name}</td>
                  <td className="px-4 py-3 text-slate-600">{app.assigned_processor}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{app.application_date}</td>
                </tr>
                {isExpanded && (
                  <tr className="bg-slate-50">
                    <td colSpan={7} className="px-4 py-4">
                      <DocumentDetailPanel
                        applicationId={app.id}
                        businessName={app.business_name}
                        documents={app.documents}
                        isTeamLead={isTeamLead}
                        updatingDocId={updatingDocId}
                        bulkUpdating={bulkUpdatingId === app.id}
                        archiving={archivingId === app.id}
                        onDocumentStatusChange={onDocumentStatusChange}
                        onBulkStatusChange={(docIds, status) =>
                          onBulkStatusChange(app.id, docIds, status)
                        }
                        onArchive={onArchive}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
      >
        {label}
        <span className="text-slate-400">{active ? (direction === "asc" ? "^" : "v") : ""}</span>
      </button>
    </th>
  );
}
