import type { JobStage } from "@/lib/types";
import { BLOCKED_REASON_LABEL } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function StageTimeline({
  stages,
  customerOnly = false,
}: {
  stages: JobStage[];
  customerOnly?: boolean;
}) {
  const visible = customerOnly ? stages.filter((s) => s.customerVisible) : stages;

  return (
    <ol className="relative">
      {visible.map((s, i) => {
        const isLast = i === visible.length - 1;
        const dotColor =
          s.status === "done"
            ? "bg-emerald-500"
            : s.status === "in_progress"
              ? "bg-blue-500"
              : s.status === "blocked"
                ? "bg-red-500"
                : "bg-zinc-300";
        return (
          <li key={s.key} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && <span className="absolute left-[7px] top-4 h-full w-px bg-zinc-200" />}
            <span className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${dotColor}`} />
            <div className="flex-1">
              <p
                className={`text-sm ${
                  s.status === "in_progress" || s.status === "blocked"
                    ? "font-semibold text-zinc-900"
                    : s.status === "done"
                      ? "text-zinc-700"
                      : "text-zinc-400"
                }`}
              >
                {s.label}
              </p>
              {s.status === "done" && s.completedAt && (
                <p className="text-xs text-zinc-400">{formatDate(s.completedAt)}</p>
              )}
              {s.status === "blocked" && (
                <p className="mt-0.5 text-xs font-medium text-red-600">
                  Blocked — {s.blockedReason ? BLOCKED_REASON_LABEL[s.blockedReason] : "reason not set"}
                  {s.blockedNote ? `: ${s.blockedNote}` : ""}
                </p>
              )}
              {s.status === "in_progress" && (
                <p className="text-xs text-blue-600">In progress</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
