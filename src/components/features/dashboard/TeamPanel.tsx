"use client";

import { useEffect, useState } from "react";

type UserRecord = { name: string; role: "processor" | "team_lead" };

export default function TeamPanel({ isTeamLead }: { isTeamLead: boolean }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingName, setUpdatingName] = useState<string | null>(null);

  useEffect(() => {
    if (!isTeamLead) {
      setIsLoading(false);
      return;
    }

    console.log("[team-panel] fetching team list");
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data: { users: UserRecord[] }) => {
        console.log("[team-panel] loaded", data.users.length, "users");
        setUsers(data.users);
      })
      .catch((err) => console.error("[team-panel] failed to load", err))
      .finally(() => setIsLoading(false));
  }, [isTeamLead]);

  async function handleRoleToggle(name: string, currentRole: string) {
    const newRole = currentRole === "team_lead" ? "processor" : "team_lead";
    console.log("[team-panel] toggling role", { name, from: currentRole, to: newRole });
    setUpdatingName(name);

    try {
      const res = await fetch("/api/users/" + encodeURIComponent(name) + "/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      console.log("[team-panel] role update response", res.status);

      if (!res.ok) {
        throw new Error("Failed to update role");
      }

      setUsers((prev) => prev.map((u) => (u.name === name ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error("[team-panel] role update failed", err);
      alert("Failed to update role. Please try again.");
    } finally {
      setUpdatingName(null);
    }
  }

  if (!isTeamLead) return null;
  if (isLoading) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-1">Team</h2>
      <p className="text-xs text-slate-500 mb-3">
        Names are added automatically from imported CSVs. Promote a processor to team lead here.
      </p>

      <div className="space-y-1.5">
        {users.map((u) => (
          <div
            key={u.name}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
          >
            <span className="text-sm text-slate-900">{u.name}</span>
            <div className="flex items-center gap-2">
              <span
                className={
                  "text-xs font-medium px-2 py-0.5 rounded-full " +
                  (u.role === "team_lead"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600")
                }
              >
                {u.role === "team_lead" ? "Team lead" : "Processor"}
              </span>
              <button
                onClick={() => handleRoleToggle(u.name, u.role)}
                disabled={updatingName === u.name}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50"
              >
                {updatingName === u.name ? "..." : u.role === "team_lead" ? "Demote" : "Promote"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
