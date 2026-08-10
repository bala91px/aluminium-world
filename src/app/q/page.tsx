"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { t } from "@/lib/strings";
import { formatINR } from "@/lib/format";
import { getPublicQuote, getPublicQuoteItems, acceptPublicQuote, type PublicQuote, type PublicQuoteItem } from "@/lib/public-data";
import { ITEM_TYPES, GLASS_SPECS, labelFor } from "@/lib/options";
import { waLink } from "@/lib/whatsapp";

function PublicQuoteView() {
  const token = useSearchParams().get("token");
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [items, setItems] = useState<PublicQuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([getPublicQuote(token), getPublicQuoteItems(token)]).then(([q, i]) => {
      setQuote(q);
      setItems(i);
      setAccepted(q?.status === "accepted");
      setLoading(false);
    });
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);
    const ok = await acceptPublicQuote(token);
    setAccepting(false);
    if (ok) setAccepted(true);
  }

  if (loading) {
    return <Centered>{t.common.loading}</Centered>;
  }
  if (!quote) {
    return <Centered>{t.common.error}</Centered>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 py-8">
      <div className="text-center">
        <p className="text-lg font-semibold">{quote.business_name}</p>
        {quote.business_address && <p className="text-xs text-muted">{quote.business_address}</p>}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">{t.quote.number}</p>
            <p className="font-semibold">{quote.quote_no}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">{t.publicQuote.title}</p>
            <p className="font-medium">{quote.customer_name}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-muted">
                {labelFor(ITEM_TYPES, item.item_type)} · {item.location_in_house} ·{" "}
                {item.sqft.toFixed(1)} sqft · {labelFor(GLASS_SPECS, item.glass_spec)}
              </span>
              <span className="font-medium">{formatINR(item.amount)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          <Line label={t.wizard.subtotal} value={formatINR(quote.subtotal)} />
          <Line label={t.wizard.gst} value={`${quote.gst_pct}%`} />
          <Line label={t.wizard.total} value={formatINR(quote.total)} bold />
          <Line label={t.publicQuote.advanceDue} value={formatINR(quote.advance_amount)} bold />
        </div>

        {quote.terms && <p className="mt-3 text-xs text-muted">{quote.terms}</p>}
      </div>

      {accepted ? (
        <p className="rounded-lg bg-status-done-bg p-4 text-center font-medium text-status-done">
          {t.publicQuote.accepted}
        </p>
      ) : (
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground disabled:opacity-50"
        >
          {accepting ? t.common.loading : t.publicQuote.accept}
        </button>
      )}

      <div className="flex gap-3">
        {quote.business_phone && (
          <a
            href={`tel:${quote.business_phone}`}
            className="flex-1 rounded-lg border border-border py-3 text-center text-sm font-medium"
          >
            {t.publicQuote.callUs}
          </a>
        )}
        {quote.business_phone && (
          <a
            href={waLink(quote.business_phone, `Hello, I have a question about quote ${quote.quote_no}`)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg border border-border py-3 text-center text-sm font-medium"
          >
            {t.publicQuote.whatsappUs}
          </a>
        )}
      </div>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted">{children}</div>;
}

export default function PublicQuotePage() {
  return (
    <Suspense fallback={null}>
      <PublicQuoteView />
    </Suspense>
  );
}
