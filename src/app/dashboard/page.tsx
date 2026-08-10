"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { t } from "@/lib/strings";
import { formatINR, formatDateDDMMYYYY } from "@/lib/format";
import { getDashboardData, type DashboardData, type DashboardJob } from "@/lib/data";
import { waLink } from "@/lib/whatsapp";
import type { Quote } from "@/lib/types";

type Attention =
  | { kind: "blocked"; job: DashboardJob; reason: string; note: string }
  | { kind: "approval"; quote: Quote & { customers: { name: string } | null } }
  | { kind: "overdue"; job: DashboardJob }
  | { kind: "stale"; quote: Quote & { customers: { name: string } | null } };

export default function DashboardPage() {
  const { profile } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getDashboardData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [profile]);

  if (!profile) return null;

  if (loading || !data) {
    return (
      <AppShell profile={profile}>
        <p className="text-sm text-muted">{t.common.loading}</p>
      </AppShell>
    );
  }

  const activeJobs = data.jobs.filter((j) => j.status === "active");
  const completedJobs = data.jobs.filter((j) => j.status === "completed");
  const blockedJobs = activeJobs.filter((j) => j.job_stages.some((s) => s.status === "blocked"));
  const overdueJobs = activeJobs.filter(
    (j) => j.promised_date && new Date(j.promised_date) < new Date() && !blockedJobs.includes(j)
  );
  const outstanding = activeJobs.reduce((sum, j) => {
    const paid = j.payments.reduce((s, p) => s + p.amount, 0);
    return sum + Math.max((j.quotes?.total ?? 0) - paid, 0);
  }, 0);

  const attention: Attention[] = [
    ...blockedJobs.map((job) => {
      const stage = job.job_stages.find((s) => s.status === "blocked");
      return {
        kind: "blocked" as const,
        job,
        reason: stage?.blocked_reason ? t.blockedReasons[stage.blocked_reason] : "",
        note: stage?.blocked_note ?? "",
      };
    }),
    ...data.pendingApprovals.map((quote) => ({ kind: "approval" as const, quote })),
    ...overdueJobs.map((job) => ({ kind: "overdue" as const, job })),
    ...data.staleQuotes.map((quote) => ({ kind: "stale" as const, quote })),
  ];

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-lg font-semibold">{t.dashboard.title}</h1>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label={t.dashboard.jobsActive} value={String(activeJobs.length)} />
          <Tile label={t.dashboard.completed} value={String(completedJobs.length)} />
          <Tile
            label={t.dashboard.blocked}
            value={String(blockedJobs.length)}
            tone={blockedJobs.length > 0 ? "blocked" : undefined}
          />
          <Tile
            label={t.dashboard.awaitingApproval}
            value={String(data.pendingApprovals.length)}
            tone={data.pendingApprovals.length > 0 ? "progress" : undefined}
          />
          <Tile label={t.dashboard.collected} value={formatINR(data.collectedThisMonth)} />
          <Tile label={t.dashboard.outstanding} value={formatINR(outstanding)} />
        </div>

        <h2 className="mb-2 text-sm font-semibold text-muted">{t.dashboard.needsAttention}</h2>
        {attention.length === 0 ? (
          <p className="mb-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted">
            {t.dashboard.noAttentionItems}
          </p>
        ) : (
          <ul className="mb-6 flex flex-col gap-2">
            {attention.map((item, i) => (
              <AttentionRow key={i} item={item} />
            ))}
          </ul>
        )}

        <h2 className="mb-2 text-sm font-semibold text-muted">{t.dashboard.allJobs}</h2>
        <ul className="flex flex-col gap-2">
          {data.jobs.map((job) => {
            const blocked = job.job_stages.some((s) => s.status === "blocked");
            return (
              <li key={job.id}>
                <Link
                  href={`/jobs/view?id=${job.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm hover:border-accent"
                >
                  <span>
                    {job.job_no} · {job.customers?.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      job.status === "completed"
                        ? "bg-status-done-bg text-status-done"
                        : blocked
                          ? "bg-status-blocked-bg text-status-blocked"
                          : "bg-status-progress-bg text-status-progress"
                    }`}
                  >
                    {job.status === "completed" ? t.dashboard.completed : blocked ? t.dashboard.blocked : t.dashboard.jobsActive}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "blocked" | "progress" }) {
  const style =
    tone === "blocked"
      ? "bg-status-blocked-bg text-status-blocked"
      : tone === "progress"
        ? "bg-status-progress-bg text-status-progress"
        : "bg-surface text-foreground";
  return (
    <div className={`rounded-xl border border-border p-4 ${style}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function AttentionRow({ item }: { item: Attention }) {
  if (item.kind === "blocked") {
    const mobile = item.job.customers?.mobile ?? "";
    return (
      <li className="rounded-lg border border-status-blocked bg-status-blocked-bg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {item.job.customers?.name} — {item.reason}
            </p>
            {item.note && <p className="text-xs text-muted">{item.note}</p>}
          </div>
          <div className="flex gap-2">
            {mobile && (
              <>
                <a href={`tel:${mobile}`} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium">
                  Call
                </a>
                <a
                  href={waLink(mobile, `Hi ${item.job.customers?.name}, following up on your job ${item.job.job_no}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium"
                >
                  WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </li>
    );
  }
  if (item.kind === "approval") {
    return (
      <Link
        href={`/quotes/view?id=${item.quote.id}`}
        className="flex items-center justify-between rounded-lg border border-status-progress bg-status-progress-bg p-3 text-sm"
      >
        <span>
          {item.quote.quote_no} · {item.quote.customers?.name} — {t.approvals.title}
        </span>
        <span className="font-medium">{formatINR(item.quote.total)}</span>
      </Link>
    );
  }
  if (item.kind === "overdue") {
    return (
      <Link
        href={`/jobs/view?id=${item.job.id}`}
        className="flex items-center justify-between rounded-lg border border-status-blocked bg-status-blocked-bg p-3 text-sm"
      >
        <span>
          {item.job.job_no} · {item.job.customers?.name} — past{" "}
          {item.job.promised_date && formatDateDDMMYYYY(item.job.promised_date)}
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={`/quotes/view?id=${item.quote.id}`}
      className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm"
    >
      <span>
        {item.quote.quote_no} · {item.quote.customers?.name} — sent, no response yet
      </span>
    </Link>
  );
}
