"use client";

import { useState } from "react";
import type { DocumentRecord, DocumentStatus } from "@/lib/types";
import type { ExpirationFlag } from "@/lib/domain/expiration";
import ExpirationDot from "@/components/ui/ExpirationDot";

type DocumentWithFlag = DocumentRecord & { expirationFlag: ExpirationFlag };

const DOCUMENT_STATUSES: DocumentStatus[] = [
  "Pending",
  "Received",
  "Under Review",
  "Approved",
  "Rejected",
];

export default function DocumentDetailPanel({
  applicationId,
  businessName,
  documents,
  isTeamLead,
  updatingDocId,
  bulkUpdating,
  archiving,
  onDocumentStatusChange,
  onBulkStatusChange,
  onArchive,
}: {
  applicationId: string;
  businessName: string;
  documents: DocumentWithFlag[];
  isTeamLead: boolean;
  updatingDocId: number | null;
  bulkUpdating: boolean;
  archiving: boolean;
  onDocumentStatusChange: (docId: number, status: string) => void;
  onBulkStatusChange: (docIds: number[], status: string) => void;
  onArchive: (appId: string, businessName: string) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatusValue, setBulkStatusValue] = useState("");

  const allSelected = documents.length > 0 && selectedIds.size === documents.length;
  const someSelected = selectedIds.size > 0;

  function toggleOne(docId: number) {
    console.log("[detail-panel] toggle checkbox", docId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  }

  function toggleAll() {
    console.log("[detail-panel] toggle select all", !allSelected);
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.id)));
    }
  }

  function handleApplyBulk() {
    if (!bulkStatusValue || selectedIds.size === 0) {
      console.log("[detail-panel] bulk apply blocked - missing status or selection");
      return;
    }
    console.log("[detail-panel] applying bulk status", {
      ids: Array.from(selectedIds),
      status: bulkStatusValue,
    });
    onBulkStatusChange(Array.from(selectedIds), bulkStatusValue);
    setSelectedIds(new Set());
    setBulkStatusValue("");
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {someSelected && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-900">
          <p className="text-xs font-medium text-white">{selectedIds.size} selected</p>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatusValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setBulkStatusValue(e.target.value)}
              className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white"
            >
              <option value="">Set status to...</option>
              {DOCUMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApplyBulk();
              }}
              disabled={!bulkStatusValue || bulkUpdating}
              className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkUpdating ? "Applying..." : "Apply"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIds(new Set());
              }}
              className="text-xs font-medium text-slate-300 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onClick={(e) => e.stopPropagation()}
                onChange={toggleAll}
                className="rounded border-slate-300"
              />
            </th>
            <th className="px-4 py-2">Document</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Expiration</th>
            <th className="px-4 py-2">Last updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(doc.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleOne(doc.id)}
                  className="rounded border-slate-300"
                />
              </td>
              <td className="px-4 py-2 text-slate-700">
                {doc.document_type}
                <span className="ml-2">
                  <ExpirationDot flag={doc.expirationFlag} size="xs" />
                </span>
              </td>
              <td className="px-4 py-2">
                <select
                  value={doc.status}
                  disabled={updatingDocId === doc.id}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onDocumentStatusChange(doc.id, e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                >
                  {DOCUMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2 text-slate-500 text-xs">
                {doc.expiration_date || "-"}
              </td>
              <td className="px-4 py-2 text-slate-500 text-xs">
                {doc.updated_by
                  ? doc.updated_by + " - " + new Date(doc.updated_at!).toLocaleDateString()
                  : "Never"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isTeamLead && (
        <div className="flex justify-end px-4 py-3 border-t border-slate-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(applicationId, businessName);
            }}
            disabled={archiving}
            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {archiving ? "Archiving..." : "Archive application"}
          </button>
        </div>
      )}
    </div>
  );
}
