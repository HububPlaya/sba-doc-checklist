import type { ApplicationStatus } from "@/lib/types";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Complete: "bg-green-50 text-green-700 border-green-200",
  Outstanding: "bg-slate-50 text-slate-700 border-slate-200",
  Stalled: "bg-red-50 text-red-700 border-red-200",
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium " +
        STATUS_STYLES[status]
      }
    >
      {status}
    </span>
  );
}
