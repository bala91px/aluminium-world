"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { t } from "@/lib/strings";
import { listEnquiries } from "@/lib/data";
import { formatDateDDMMYYYY } from "@/lib/format";
import type { Enquiry, EnquiryStatus } from "@/lib/types";

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: t.enquiry.statusNew,
  assigned: t.enquiry.statusAssigned,
  site_visit_scheduled: t.enquiry.statusScheduled,
  converted: t.enquiry.statusConverted,
};

const STATUS_STYLE: Record<EnquiryStatus, string> = {
  new: "bg-status-blocked-bg text-status-blocked",
  assigned: "bg-status-progress-bg text-status-progress",
  site_visit_scheduled: "bg-status-progress-bg text-status-progress",
  converted: "bg-status-done-bg text-status-done",
};

export default function EnquiriesPage() {
  const { profile } = useSession();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    listEnquiries().then((rows) => {
      setEnquiries(rows);
      setLoading(false);
    });
  }, [profile]);

  if (!profile) return null;

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{t.enquiry.listTitle}</h1>
            <p className="text-sm text-muted">{t.enquiry.subtitle}</p>
          </div>
          <Link
            href="/enquiries/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            {t.enquiry.title}
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : enquiries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            {t.enquiry.empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {enquiries.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
              >
                <div>
                  <p className="font-medium">{e.customer_name}</p>
                  <p className="text-sm text-muted">{e.customer_mobile}</p>
                  {e.rough_need && (
                    <p className="mt-1 text-sm text-muted">{e.rough_need}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {formatDateDDMMYYYY(e.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[e.status]}`}
                  >
                    {STATUS_LABEL[e.status]}
                  </span>
                  {e.status !== "converted" && (
                    <Link
                      href={`/quotes/new?enquiryId=${e.id}&name=${encodeURIComponent(e.customer_name)}&mobile=${encodeURIComponent(e.customer_mobile)}`}
                      className="text-xs font-medium text-accent underline"
                    >
                      {t.enquiry.startSiteVisit}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
