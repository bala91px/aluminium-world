import { notFound, redirect } from "next/navigation";
import { readDB } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { QUOTE_STATUS_COLOR, QUOTE_STATUS_LABEL } from "@/lib/status";
import AcceptQuote from "@/components/AcceptQuote";

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = readDB();
  const quote = db.quotes.find((q) => q.publicToken === token);
  if (!quote) notFound();

  const job = db.jobs.find((j) => j.quoteId === quote.id);
  if (job) redirect(`/track/${job.publicToken}`);

  const customer = db.customers.find((c) => c.id === quote.customerId);
  const site = db.sites.find((s) => s.id === quote.siteId);
  const canAccept = quote.status === "sent";
  const notReady = quote.status === "pending_approval" || quote.status === "approved";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-zinc-50 px-4 py-8">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Aluminium World</p>
        <h1 className="text-xl font-semibold text-zinc-900">Quote {quote.quoteNo}</h1>
        <p className="mt-1 text-sm text-zinc-500">For {customer?.name} · {site?.label}</p>
      </div>

      {notReady && (
        <Card className="mb-4 p-4 text-center text-sm text-zinc-600">
          This quote is still being finalised. We&rsquo;ll send you the link once it&rsquo;s ready.
        </Card>
      )}

      {quote.status === "rejected" && (
        <Card className="mb-4 p-4 text-center text-sm text-zinc-600">
          This quote is no longer active. Please contact us for an updated quote.
        </Card>
      )}

      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Items</h2>
          <Badge color={QUOTE_STATUS_COLOR[quote.status]}>{QUOTE_STATUS_LABEL[quote.status]}</Badge>
        </div>
        <div className="flex flex-col gap-3">
          {quote.items.map((it) => (
            <div key={it.id} className="border-b border-zinc-100 pb-3 text-sm last:border-0 last:pb-0">
              <div className="flex justify-between">
                <span className="font-medium text-zinc-900">{it.itemType} — {it.locationInHouse}</span>
                <span className="font-medium text-zinc-900">{formatMoney(it.amount)}</span>
              </div>
              <p className="text-zinc-500">
                {it.systemSeries} · {it.glassSpec} · {it.finish}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-zinc-600"><span>Subtotal</span><span>{formatMoney(quote.subtotal)}</span></div>
          <div className="flex justify-between text-zinc-600"><span>GST ({quote.gstPct}%)</span><span>{formatMoney(quote.total - (quote.subtotal - quote.discountValue))}</span></div>
          <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-base font-semibold text-zinc-900">
            <span>Total</span><span>{formatMoney(quote.total)}</span>
          </div>
          <div className="flex justify-between font-medium text-emerald-700">
            <span>Advance to start ({quote.advancePct}%)</span><span>{formatMoney(quote.advanceAmount)}</span>
          </div>
          <div className="flex justify-between text-zinc-500"><span>Delivery lead time</span><span>{quote.leadTimeDays} days</span></div>
        </div>
      </Card>

      {canAccept && <AcceptQuote token={quote.publicToken} />}
      {quote.status === "accepted" && (
        <Card className="p-4 text-center text-sm text-emerald-700">
          Accepted — our team will collect the advance to start your job.
        </Card>
      )}
    </div>
  );
}
