"use client";

import { useEffect, useState } from "react";

export default function AlertSettingsPanel({ isTeamLead }: { isTeamLead: boolean }) {
  const [email, setEmail] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    console.log("[alert-settings] fetching current recipient");
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : { alertRecipientEmail: null }))
      .then((data: { alertRecipientEmail: string | null }) => {
        console.log("[alert-settings] current recipient", data.alertRecipientEmail);
        setEmail(data.alertRecipientEmail);
        setInputValue(data.alertRecipientEmail || "");
      })
      .catch((err) => console.error("[alert-settings] failed to load", err))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave() {
    console.log("[alert-settings] saving recipient", inputValue);
    setIsSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertRecipientEmail: inputValue }),
      });

      console.log("[alert-settings] save response", res.status);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save");
      }

      setEmail(inputValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("[alert-settings] save failed", err);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-1">Email alerts</h2>
      <p className="text-xs text-slate-500 mb-3">
        Expiring document alerts are sent automatically when this dashboard loads.
      </p>

      {!isTeamLead && (
        <p className="text-sm text-slate-600">
          {email ? "Sending to " + email : "No recipient configured yet."}
        </p>
      )}

      {isTeamLead && (
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="team-lead@example.com"
            className="flex-1 max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button
            onClick={handleSave}
            disabled={isSaving || !inputValue}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          {saved && <span className="text-xs text-green-600">Saved</span>}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
