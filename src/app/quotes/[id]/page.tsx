import { notFound } from "next/navigation";
import { readDB } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card } from "@/components/ui";
import { QUOTE_STATUS_COLOR, QUOTE_STATUS_LABEL } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";
import { ApprovalButtons, RecordAdvance, ShareQuote } from "@/components/QuoteActions";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const db = readDB();
  const quote = db.quotes.find((q) => q.id === id);
  if (!quote) notFound();

  const customer = db.customers.find((c) => c.id === quote.customerId);
  const site = db.sites.find((s) => s.id === quote.siteId);
  const job = db.jobs.find((j) => j.quoteId === quote.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">{quote.quoteNo}</h1>
          <p className="text-sm text-zinc-500">{customer?.name} · {customer?.mobile}</p>
          <p className="text-sm text-zinc-500">{site?.label}</p>
        </div>
        <Badge color={QUOTE_STATUS_COLOR[quote.status]}>{QUOTE_STATUS_LABEL[quote.status]}</Badge>
      </div>

      {quote.status === "rejected" && quote.rejectedReason && (
        <Card className="mb-4 border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Rejected: {quote.rejectedReason}
        </Card>
      )}

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Items</h2>
        <div className="flex flex-col gap-3">
          {quote.items.map((it) => (
            <div key={it.id} className="border-b border-zinc-100 pb-3 text-sm last:border-0 last:pb-0">
              <div className="flex justify-between">
                <span className="font-medium text-zinc-900">
                  {it.itemType} — {it.locationInHouse}
                </span>
                <span className="font-medium text-zinc-900">{formatMoney(it.amount)}</span>
              </div>
              <p className="text-zinc-500">
                {it.widthMm}×{it.heightMm}mm · qty {it.quantity} · {it.sqft} sqft{it.minApplied ? " (min applied)" : ""} · ₹{it.rate}/sqft
              </p>
              <p className="text-zinc-500">
                {it.systemSeries} · {it.glassSpec} · {it.finish} · {it.hardware}{it.mesh ? " · mesh" : ""}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-zinc-600"><span>Subtotal</span><span>{formatMoney(quote.subtotal)}</span></div>
          <div className="flex justify-between text-zinc-600"><span>Discount</span><span>-{formatMoney(quote.discountValue)}</span></div>
          <div className="flex justify-between text-zinc-600"><span>GST ({quote.gstPct}%)</span><span>{formatMoney(quote.total - (quote.subtotal - quote.discountValue))}</span></div>
          <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-base font-semibold text-zinc-900">
            <span>Total</span><span>{formatMoney(quote.total)}</span>
          </div>
          <div className="flex justify-between font-medium text-emerald-700">
            <span>Advance ({quote.advancePct}%)</span><span>{formatMoney(quote.advanceAmount)}</span>
          </div>
          <div className="flex justify-between text-zinc-500"><span>Lead time</span><span>{quote.leadTimeDays} days</span></div>
          <div className="flex justify-between text-zinc-500"><span>Created</span><span>{formatDate(quote.createdAt)}</span></div>
        </div>
      </Card>

      {user.role === "owner" && quote.status === "pending_approval" && (
        <Card className="mb-4 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Approval</h2>
          <ApprovalButtons quoteId={quote.id} />
        </Card>
      )}

      {(quote.status === "sent" || quote.status === "accepted") && customer && (
        <Card className="mb-4 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Customer link</h2>
          <ShareQuote token={quote.publicToken} mobile={customer.mobile} quoteNo={quote.quoteNo} />
        </Card>
      )}

      {quote.status === "accepted" && !job && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Advance payment</h2>
          <RecordAdvance quoteId={quote.id} advanceAmount={quote.advanceAmount} />
        </Card>
      )}

      {job && (
        <Card className="p-4">
          <p className="text-sm text-zinc-600">
            Job created: <span className="font-medium text-zinc-900">{job.jobNo}</span>
          </p>
          <a href={`/jobs/${job.id}`} className="mt-2 inline-block text-sm font-medium text-zinc-900 underline">
            Open job tracker →
          </a>
        </Card>
      )}
    </div>
  );
}
