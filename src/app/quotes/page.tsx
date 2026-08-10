"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { t } from "@/lib/strings";
import { formatINR, formatDateDDMMYYYY } from "@/lib/format";
import { listQuotes } from "@/lib/data";
import type { Quote, QuoteStatus } from "@/lib/types";

const STATUS_STYLE: Record<QuoteStatus, string> = {
  draft: "bg-status-pending-bg text-status-pending",
  pending_approval: "bg-status-progress-bg text-status-progress",
  approved: "bg-status-done-bg text-status-done",
  rejected: "bg-status-blocked-bg text-status-blocked",
  sent: "bg-status-progress-bg text-status-progress",
  accepted: "bg-status-done-bg text-status-done",
};

type Row = Quote & { customers: { name: string } | null; sites: { label: string } | null };

export default function QuotesPage() {
  const { profile } = useSession();
  const [quotes, setQuotes] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    listQuotes().then((rows) => {
      setQuotes(rows);
      setLoading(false);
    });
  }, [profile]);

  if (!profile) return null;

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{t.nav.quotes}</h1>
          <Link
            href="/quotes/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            + {t.quote.new}
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : quotes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            {t.common.notConfigured}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {quotes.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/quotes/view?id=${q.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 hover:border-accent"
                >
                  <div>
                    <p className="font-medium">{q.quote_no}</p>
                    <p className="text-sm text-muted">
                      {q.customers?.name} · {q.sites?.label}
                    </p>
                    <p className="text-xs text-muted">{formatDateDDMMYYYY(q.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[q.status]}`}>
                      {t.quote.status[q.status]}
                    </span>
                    <span className="text-sm font-medium">{formatINR(q.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
