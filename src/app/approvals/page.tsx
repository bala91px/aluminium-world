"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { t } from "@/lib/strings";
import { formatINR, formatDateDDMMYYYY } from "@/lib/format";
import { listPendingApprovals } from "@/lib/data";
import type { Quote } from "@/lib/types";

export default function ApprovalsPage() {
  const { profile } = useSession();
  const [quotes, setQuotes] = useState<(Quote & { customers: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    listPendingApprovals().then((rows) => {
      setQuotes(rows);
      setLoading(false);
    });
  }, [profile]);

  if (!profile) return null;

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <h1 className="text-lg font-semibold">{t.approvals.title}</h1>
          <p className="text-sm text-muted">{t.approvals.subtitle}</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : quotes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            {t.approvals.empty}
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
                    <p className="text-sm text-muted">{q.customers?.name}</p>
                    <p className="text-xs text-muted">{formatDateDDMMYYYY(q.created_at)}</p>
                  </div>
                  <span className="text-sm font-medium">{formatINR(q.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
