"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { t } from "@/lib/strings";
import { formatINR, formatDateDDMMYYYY } from "@/lib/format";
import { approveQuote, getQuoteDetail, markQuoteSent, rejectQuote, type QuoteDetail } from "@/lib/data";
import { ITEM_TYPES, GLASS_SPECS, labelFor } from "@/lib/options";
import { waLink } from "@/lib/whatsapp";
import { publicUrl } from "@/lib/site-url";
import { QrCode } from "@/components/QrCode";

function QuoteView() {
  const { profile } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getQuoteDetail(id).then((q) => {
      setQuote(q);
      setLoading(false);
    });
  }, [id]);

  if (!profile) return null;

  async function refresh() {
    if (!id) return;
    setQuote(await getQuoteDetail(id));
  }

  async function handleApprove() {
    if (!id || !profile) return;
    setBusy(true);
    await approveQuote(id, profile.id);
    await refresh();
    setBusy(false);
  }

  async function handleReject() {
    if (!id || !rejectReason.trim()) return;
    setBusy(true);
    await rejectQuote(id, rejectReason);
    await refresh();
    setBusy(false);
    setShowReject(false);
  }

  async function handleSendToCustomer() {
    if (!id || !quote) return;
    setBusy(true);
    await markQuoteSent(id);
    await refresh();
    setBusy(false);
    const url = publicUrl("/q", quote.public_token);
    const message = `Hello ${quote.customers?.name}, here is your quotation from Aluminium World: ${url}`;
    window.open(waLink(quote.customers?.mobile ?? "", message), "_blank");
  }

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-lg">
        {loading || !quote ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-lg font-semibold">{quote.quote_no}</h1>
                <p className="text-sm text-muted">
                  {quote.customers?.name} · {quote.sites?.label}
                </p>
                <p className="text-xs text-muted">{formatDateDDMMYYYY(quote.created_at)}</p>
              </div>
              <span className="rounded-full bg-status-pending-bg px-2.5 py-1 text-xs font-medium text-status-pending">
                {t.quote.status[quote.status]}
              </span>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-sm">
              {quote.quote_items.map((item) => (
                <div key={item.id} className="flex justify-between border-b border-border pb-2 last:border-0">
                  <span className="text-muted">
                    {labelFor(ITEM_TYPES, item.item_type)} · {item.location_in_house} ·{" "}
                    {item.sqft.toFixed(1)} sqft · {labelFor(GLASS_SPECS, item.glass_spec)} · ₹{item.rate}/sqft
                  </span>
                  <span className="font-medium">{formatINR(item.amount)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-1 rounded-xl bg-status-pending-bg p-4 text-sm">
              <Line label={t.wizard.subtotal} value={formatINR(quote.subtotal)} />
              <Line label={t.wizard.gst} value={`${quote.gst_pct}%`} />
              <Line label={t.wizard.total} value={formatINR(quote.total)} bold />
              <Line
                label={t.wizard.advanceAmount}
                value={`${formatINR(quote.advance_amount)} (${quote.advance_pct}%)`}
                bold
              />
              <Line label={t.wizard.leadTime} value={`${quote.lead_time_days} days`} />
            </div>

            {quote.rejected_reason && (
              <p className="mt-3 rounded-lg bg-status-blocked-bg p-3 text-sm text-status-blocked">
                {quote.rejected_reason}
              </p>
            )}

            {profile.role === "owner" && quote.status === "pending_approval" && (
              <div className="mt-5 flex flex-col gap-2">
                {showReject ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
                    <textarea
                      className="input min-h-16"
                      placeholder={t.approvals.rejectReasonPlaceholder}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowReject(false)} className="rounded-lg border border-border px-4 py-2 text-sm">
                        {t.common.cancel}
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={busy || !rejectReason.trim()}
                        className="flex-1 rounded-lg bg-status-blocked px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {t.approvals.reject}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReject(true)}
                      disabled={busy}
                      className="flex-1 rounded-lg border border-status-blocked px-4 py-3 text-sm font-medium text-status-blocked"
                    >
                      {t.approvals.reject}
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={busy}
                      className="flex-1 rounded-lg bg-status-done px-4 py-3 text-sm font-medium text-white"
                    >
                      {t.approvals.approve}
                    </button>
                  </div>
                )}
              </div>
            )}

            {(quote.status === "approved" || quote.status === "sent") && quote.customers && (
              <div className="mt-5 flex flex-col items-center gap-3">
                <button
                  onClick={handleSendToCustomer}
                  disabled={busy}
                  className="w-full rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground"
                >
                  {t.publicQuote.whatsappUs}
                </button>
                <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4">
                  <QrCode value={publicUrl("/q", quote.public_token)} size={140} />
                  <p className="text-xs text-muted">{t.publicQuote.scanToOpen}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => router.back()}
              className="mt-3 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium"
            >
              {t.common.back}
            </button>
          </>
        )}
      </div>
    </AppShell>
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

export default function QuoteViewPage() {
  return (
    <Suspense fallback={null}>
      <QuoteView />
    </Suspense>
  );
}
