"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { t } from "@/lib/strings";
import { listJobs } from "@/lib/data";
import { formatDateDDMMYYYY } from "@/lib/format";
import type { Job, StageStatus } from "@/lib/types";

type Row = Job & { customers: { name: string } | null; job_stages: { status: StageStatus }[] };

function overallStatus(row: Row): { label: string; style: string } {
  if (row.status === "completed") return { label: t.jobStages.closed, style: "bg-status-done-bg text-status-done" };
  const blocked = row.job_stages.some((s) => s.status === "blocked");
  if (blocked) return { label: t.dashboard.blocked, style: "bg-status-blocked-bg text-status-blocked" };
  const overdue = row.promised_date && new Date(row.promised_date) < new Date();
  if (overdue) return { label: "Overdue", style: "bg-status-blocked-bg text-status-blocked" };
  return { label: t.dashboard.jobsActive, style: "bg-status-progress-bg text-status-progress" };
}

export default function JobsPage() {
  const { profile } = useSession();
  const [jobs, setJobs] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    listJobs().then((rows) => {
      setJobs(rows);
      setLoading(false);
    });
  }, [profile]);

  if (!profile) return null;

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-lg font-semibold">{t.nav.jobs}</h1>

        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : jobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            {t.common.notConfigured}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {jobs.map((job) => {
              const status = overallStatus(job);
              return (
                <li key={job.id}>
                  <Link
                    href={`/jobs/view?id=${job.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 hover:border-accent"
                  >
                    <div>
                      <p className="font-medium">{job.job_no}</p>
                      <p className="text-sm text-muted">{job.customers?.name}</p>
                      {job.promised_date && (
                        <p className="text-xs text-muted">
                          {t.tracker.promisedDelivery}: {formatDateDDMMYYYY(job.promised_date)}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.style}`}>
                      {status.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
