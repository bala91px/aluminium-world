import Link from "next/link";
import type { ReactNode } from "react";
import { readDB } from "@/lib/db";
import { requireOwner } from "@/lib/session";
import { Badge, Card } from "@/components/ui";
import DashboardTile from "@/components/DashboardTile";
import { formatDate, formatMoney, daysAgo } from "@/lib/format";
import { BLOCKED_REASON_LABEL } from "@/lib/types";
import { JOB_STATUS_COLOR, JOB_STATUS_LABEL } from "@/lib/status";

export default async function DashboardPage() {
  await requireOwner();
  const db = readDB();

  const activeJobs = db.jobs.filter((j) => j.status === "active");
  const completedJobs = db.jobs.filter((j) => j.status === "completed");
  const blockedJobs = db.jobs.filter((j) => j.status === "blocked");
  const pendingAdvance = db.quotes.filter(
    (q) => q.status === "accepted" && !db.jobs.some((j) => j.quoteId === q.id),
  );

  const now = new Date();
  const collectedThisMonth = db.payments
    .filter((p) => {
      const d = new Date(p.receivedOn);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + p.amount, 0);

  const outstanding = [...activeJobs, ...blockedJobs].reduce((s, j) => {
    const quote = db.quotes.find((q) => q.id === j.quoteId);
    const paid = db.payments.filter((p) => p.jobId === j.id).reduce((a, p) => a + p.amount, 0);
    return s + Math.max((quote?.total ?? 0) - paid, 0);
  }, 0);

  const pendingApprovalQuotes = db.quotes
    .filter((q) => q.status === "pending_approval")
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  const overdueJobs = db.jobs.filter(
    (j) => j.status !== "completed" && new Date(j.promisedDate).getTime() < Date.now(),
  );

  const staleQuotes = db.quotes.filter(
    (q) => q.status === "sent" && q.sentAt && daysAgo(q.sentAt) > 7,
  );

  type Attention = { key: string; jsx: ReactNode };
  const attention: Attention[] = [];

  blockedJobs
    .slice()
    .sort((a, b) => {
      const as = a.stages.find((s) => s.status === "blocked")?.startedAt ?? "";
      const bs = b.stages.find((s) => s.status === "blocked")?.startedAt ?? "";
      return as < bs ? 1 : -1;
    })
    .forEach((j) => {
      const cust = db.customers.find((c) => c.id === j.customerId);
      const site = db.sites.find((s) => s.id === j.siteId);
      const stage = j.stages.find((s) => s.status === "blocked");
      const reasonLabel = stage?.blockedReason ? BLOCKED_REASON_LABEL[stage.blockedReason] : "Blocked";
      const since = stage?.startedAt ? daysAgo(stage.startedAt) : 0;
      attention.push({
        key: `blocked-${j.id}`,
        jsx: (
          <Card className="flex items-center justify-between gap-3 border-red-200 bg-red-50 p-4">
            <Link href={`/jobs/${j.id}`} className="flex-1">
              <p className="text-sm font-medium text-red-900">
                {site?.label ?? cust?.name} — {reasonLabel.toLowerCase()}
                {since > 0 ? ` since ${since}d` : ""}
              </p>
              <p className="text-xs text-red-700">{cust?.name} · {j.jobNo}</p>
            </Link>
            <div className="flex gap-2">
              {cust && (
                <>
                  <a href={`tel:${cust.mobile}`} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm">
                    Call
                  </a>
                  <a
                    href={`https://wa.me/91${cust.mobile}?text=${encodeURIComponent(
                      `Hi ${cust.name}, following up on your job ${j.jobNo} — it's currently held up on ${reasonLabel.toLowerCase()}.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm"
                  >
                    WhatsApp
                  </a>
                </>
              )}
            </div>
          </Card>
        ),
      });
    });

  pendingApprovalQuotes.forEach((q) => {
    const cust = db.customers.find((c) => c.id === q.customerId);
    attention.push({
      key: `approve-${q.id}`,
      jsx: (
        <Link href={`/quotes/${q.id}`}>
          <Card className="flex items-center justify-between p-4 hover:border-zinc-300">
            <p className="text-sm text-zinc-700">
              Quote {q.quoteNo} awaiting your approval — {cust?.name} · {formatMoney(q.total)}
            </p>
            <Badge color="amber">{daysAgo(q.createdAt)}d ago</Badge>
          </Card>
        </Link>
      ),
    });
  });

  overdueJobs.forEach((j) => {
    const cust = db.customers.find((c) => c.id === j.customerId);
    attention.push({
      key: `overdue-${j.id}`,
      jsx: (
        <Link href={`/jobs/${j.id}`}>
          <Card className="flex items-center justify-between p-4 hover:border-zinc-300">
            <p className="text-sm text-zinc-700">
              {j.jobNo} past promised delivery ({formatDate(j.promisedDate)}) — {cust?.name}
            </p>
            <Badge color="purple">Overdue</Badge>
          </Card>
        </Link>
      ),
    });
  });

  staleQuotes.forEach((q) => {
    const cust = db.customers.find((c) => c.id === q.customerId);
    attention.push({
      key: `stale-${q.id}`,
      jsx: (
        <Link href={`/quotes/${q.id}`}>
          <Card className="flex items-center justify-between p-4 hover:border-zinc-300">
            <p className="text-sm text-zinc-700">
              Quote {q.quoteNo} sent {daysAgo(q.sentAt)}d ago, no response — {cust?.name}
            </p>
            <Badge color="blue">Follow up</Badge>
          </Card>
        </Link>
      ),
    });
  });

  const allJobs = db.jobs.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-lg font-semibold text-zinc-900">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardTile label="Jobs active" value={activeJobs.length} />
        <DashboardTile label="Completed" value={completedJobs.length} tone="good" />
        <DashboardTile label="Awaiting advance" value={pendingAdvance.length} />
        <DashboardTile label="Blocked" value={blockedJobs.length} tone="danger" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <DashboardTile label="₹ collected this month" value={formatMoney(collectedThisMonth)} tone="good" />
        <DashboardTile label="₹ outstanding" value={formatMoney(outstanding)} />
        <DashboardTile label="Quotes awaiting approval" value={pendingApprovalQuotes.length} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Needs your attention</h2>
      <div className="mb-8 flex flex-col gap-2">
        {attention.length === 0 && (
          <Card className="p-6 text-center text-sm text-zinc-500">Nothing needs attention right now.</Card>
        )}
        {attention.map((a) => <div key={a.key}>{a.jsx}</div>)}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-zinc-900">All jobs</h2>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Job</th>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Stage</th>
              <th className="px-4 py-2 font-medium">Promised</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {allJobs.map((j) => {
              const cust = db.customers.find((c) => c.id === j.customerId);
              const stage = j.stages.find((s) => s.status === "in_progress" || s.status === "blocked");
              return (
                <tr key={j.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-2">
                    <Link href={`/jobs/${j.id}`} className="font-medium text-zinc-900">{j.jobNo}</Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-600">{cust?.name}</td>
                  <td className="px-4 py-2 text-zinc-600">{stage?.label ?? "Complete"}</td>
                  <td className="px-4 py-2 text-zinc-600">{formatDate(j.promisedDate)}</td>
                  <td className="px-4 py-2">
                    <Badge color={JOB_STATUS_COLOR[j.status]}>{JOB_STATUS_LABEL[j.status]}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
