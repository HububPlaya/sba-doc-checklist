"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/", label: "Applications" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/import", label: "Import" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || "";
  const role = (session?.user as { role?: string } | undefined)?.role || "";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Doc Checklist</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const baseClasses = "block rounded-lg px-3 py-2 text-sm font-medium transition-colors";
            const activeClasses = "bg-slate-900 text-white";
            const inactiveClasses = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={baseClasses + " " + (isActive ? activeClasses : inactiveClasses)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
          <p className="text-xs text-slate-500 mb-3 capitalize">{role.replace("_", " ")}</p>
          <button
            onClick={() => {
              console.log("[layout] signing out");
              signOut({ callbackUrl: "/login" });
            }}
            className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

