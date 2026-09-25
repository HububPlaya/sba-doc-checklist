"use client";

import { useEffect, useState } from "react";
import type { ImportSummary } from "@/lib/types";

const EXPECTED_COLUMNS = [
  "application_id",
  "business_name",
  "borrower_name",
  "loan_amount",
  "application_date",
  "assigned_processor",
  "document_type",
  "document_status",
  "date_received",
  "expiration_date",
  "notes",
];

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState("");
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [showColumns, setShowColumns] = useState(false);

  function loadActiveCount() {
    console.log("[import] fetching current application count");
    fetch("/api/applications")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown[]) => {
        console.log("[import] current active count", data.length);
        setActiveCount(data.length);
      })
      .catch((err) => console.error("[import] failed to load count", err));
  }

  useEffect(() => {
    loadActiveCount();
  }, []);

  function selectFile(selected: File | null) {
    console.log("[import] file selected", selected?.name);
    setFile(selected);
    setSummary(null);
    setError("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    selectFile(e.target.files?.[0] || null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    console.log("[import] file dropped");
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.endsWith(".csv")) {
      selectFile(dropped);
    } else {
      console.log("[import] dropped file rejected - not a csv");
      setError("Please drop a .csv file.");
    }
  }

  async function handleUpload() {
    if (!file) {
      console.log("[import] upload blocked: no file");
      return;
    }

    console.log("[import] starting upload", { name: file.name, size: file.size });
    setIsUploading(true);
    setError("");
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      console.log("[import] response status", res.status);

      if (!res.ok) {
        throw new Error("Import failed: " + res.status);
      }

      const data: ImportSummary = await res.json();
      console.log("[import] summary received", data);
      setSummary(data);
      loadActiveCount();
    } catch (err) {
      console.error("[import] upload error", err);
      setError("Import failed. Please check the file and try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Import applications</h1>
            <p className="text-sm text-slate-500 mt-1">
              Upload a CSV to add new applications and documents. Existing entries are matched by
              application ID and document type; only source fields are updated on re-import -
              statuses and notes you've already set are never overwritten.
            </p>
          </div>
        </div>

        {activeCount !== null && (
          <div className="mb-4 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{activeCount}</span> active application
            {activeCount === 1 ? "" : "s"} currently in the system
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={
              "rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors " +
              (isDragging
                ? "border-slate-900 bg-slate-50"
                : "border-slate-300 bg-slate-50/50")
            }
          >
            {file ? (
              <div>
                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB - ready to import
                </p>
                <button
                  onClick={() => selectFile(null)}
                  className="mt-3 text-xs font-medium text-slate-500 hover:text-red-600"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-600">Drag and drop a CSV file here</p>
                <p className="text-xs text-slate-400 mt-1 mb-3">or</p>
                <label className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm cursor-pointer hover:bg-slate-800 transition-colors">
                  Browse files
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? "Importing..." : "Import CSV"}
          </button>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {summary && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-medium text-slate-900 mb-3">Import summary</h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-center">
                  <div className="text-lg font-semibold text-green-700">{summary.inserted}</div>
                  <div className="text-xs text-green-600">Inserted</div>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-center">
                  <div className="text-lg font-semibold text-blue-700">{summary.updated}</div>
                  <div className="text-xs text-blue-600">Updated</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-center">
                  <div className="text-lg font-semibold text-slate-700">{summary.skipped}</div>
                  <div className="text-xs text-slate-600">Skipped</div>
                </div>
              </div>

              {summary.skippedRows.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-1">Skipped rows</p>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    {summary.skippedRows.map((s) => (
                      <li key={s.row}>
                        Row {s.row}: {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.flaggedUnknownTypes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-1">
                    Unrecognized document types (imported anyway)
                  </p>
                  <ul className="text-xs text-amber-700 space-y-0.5">
                    {[...new Set(summary.flaggedUnknownTypes)].map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setShowColumns((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Expected CSV columns
            <span className="text-slate-400">{showColumns ? "-" : "+"}</span>
          </button>
          {showColumns && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {EXPECTED_COLUMNS.map((col) => (
                  <span
                    key={col}
                    className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
