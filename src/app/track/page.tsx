"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { t } from "@/lib/strings";
import { formatINR, formatDateDDMMYYYY } from "@/lib/format";
import {
  getPublicJob,
  getPublicJobStages,
  type PublicJob,
  type PublicJobStage,
} from "@/lib/public-data";

function TrackView() {
  const token = useSearchParams().get("token");
  const [job, setJob] = useState<PublicJob | null>(null);
  const [stages, setStages] = useState<PublicJobStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([getPublicJob(token), getPublicJobStages(token)]).then(([j, s]) => {
      setJob(j);
      setStages(s);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <Centered>{t.common.loading}</Centered>;
  if (!job) return <Centered>{t.common.error}</Centered>;

  const balance = job.total - job.paid;
  const currentIndex = stages.findIndex((s) => s.status !== "done");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 py-8">
      <div className="text-center">
        <p className="text-lg font-semibold">{t.tracker.title}</p>
        <p className="text-sm text-muted">
          {job.job_no} · {job.customer_name}
        </p>
      </div>

      <div className="flex justify-between rounded-lg bg-status-pending-bg p-3 text-sm">
        {job.promised_date && (
          <span>
            {t.tracker.promisedDelivery}: <strong>{formatDateDDMMYYYY(job.promised_date)}</strong>
          </span>
        )}
        <span>
          {t.tracker.balance}: <strong>{formatINR(balance)}</strong>
        </span>
      </div>

      <ol className="flex flex-col gap-0">
        {stages.map((stage, i) => {
          const isCurrent = i === currentIndex;
          const isDone = stage.status === "done";
          const isBlocked = stage.status === "blocked";
          return (
            <li key={stage.stage_key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`h-3 w-3 rounded-full ${
                    isDone
                      ? "bg-status-done"
                      : isBlocked
                        ? "bg-status-blocked"
                        : isCurrent
                          ? "bg-status-progress"
                          : "bg-border"
                  }`}
                />
                {i < stages.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="pb-5">
                <p
                  className={`text-sm ${
                    isDone || isCurrent ? "font-medium text-foreground" : "text-muted"
                  }`}
                >
                  {t.jobStages[stage.stage_key as keyof typeof t.jobStages]}
                </p>
                {isBlocked && <p className="text-xs text-status-blocked">{t.tracker.stageBlocked}</p>}
                {stage.completed_at && (
                  <p className="text-xs text-muted">{formatDateDDMMYYYY(stage.completed_at)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {job.business_phone && (
        <a
          href={`tel:${job.business_phone}`}
          className="rounded-lg border border-border py-3 text-center text-sm font-medium"
        >
          {t.tracker.callUs}
        </a>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted">{children}</div>;
}

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackView />
    </Suspense>
  );
}
