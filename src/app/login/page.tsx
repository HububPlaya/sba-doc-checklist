"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [names, setNames] = useState<string[]>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("[login] fetching known names");
    fetch("/api/users/names")
      .then((res) => (res.ok ? res.json() : { names: [] }))
      .then((data: { names: string[] }) => {
        console.log("[login] loaded", data.names.length, "names");
        setNames(data.names);
      })
      .catch((err) => console.error("[login] failed to load names", err))
      .finally(() => setIsLoadingNames(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[login] submit attempt", { name });

    if (!name) {
      console.log("[login] blocked: no name selected");
      setError("Please select your name.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await signIn("credentials", { name, redirect: false });
      console.log("[login] signIn result", result);

      if (result?.error) {
        console.log("[login] auth failed", result.error);
        setError("Name not recognized - check with your team lead.");
      } else {
        console.log("[login] success, redirecting to /");
        window.location.href = "/";
      }
    } catch (err) {
      console.error("[login] unexpected error", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Sign in</h1>
        <p className="text-sm text-slate-500 mb-6">
          Select your name to access the document checklist.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>
            <select
              id="name"
              value={name}
              disabled={isLoadingNames}
              onChange={(e) => {
                console.log("[login] name selected", e.target.value);
                setName(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
            >
              <option value="">
                {isLoadingNames ? "Loading..." : "Select your name"}
              </option>
              {names.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingNames}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Log in"}
          </button>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
