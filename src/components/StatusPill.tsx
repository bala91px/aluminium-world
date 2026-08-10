import type { StageStatus } from "@/lib/types";

const STYLES: Record<StageStatus, string> = {
  done: "bg-status-done-bg text-status-done",
  in_progress: "bg-status-progress-bg text-status-progress",
  pending: "bg-status-pending-bg text-status-pending",
  blocked: "bg-status-blocked-bg text-status-blocked",
};

export function StatusPill({ status, label }: { status: StageStatus; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {label}
    </span>
  );
}
