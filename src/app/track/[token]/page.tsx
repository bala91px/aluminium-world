import { notFound } from "next/navigation";
import { readDB } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import { JOB_STATUS_COLOR, JOB_STATUS_LABEL } from "@/lib/status";
import StageTimeline from "@/components/StageTimeline";

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = readDB();
  const job = db.jobs.find((j) => j.publicToken === token);
  if (!job) notFound();

  const customer = db.customers.find((c) => c.id === job.customerId);
  const quote = db.quotes.find((q) => q.id === job.quoteId);
  const paid = db.payments.filter((p) => p.jobId === job.id).reduce((s, p) => s + p.amount, 0);
  const total = quote?.total ?? 0;
  const balanceDue = Math.max(total - paid, 0);
  const ownerPhone = db.settings.phone;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-zinc-50 px-4 py-8">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Aluminium World</p>
        <h1 className="text-xl font-semibold text-zinc-900">Job {job.jobNo}</h1>
        <p className="mt-1 text-sm text-zinc-500">{customer?.name}</p>
      </div>

      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-zinc-500">Status</span>
          <Badge color={JOB_STATUS_COLOR[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-zinc-600"><span>Promised delivery</span><span className="font-medium text-zinc-900">{formatDate(job.promisedDate)}</span></div>
          <div className="flex justify-between text-zinc-600"><span>Paid</span><span>{formatMoney(paid)}</span></div>
          <div className="flex justify-between text-zinc-600"><span>Balance</span><span>{formatMoney(balanceDue)}</span></div>
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Progress</h2>
        <StageTimeline stages={job.stages} customerOnly />
      </Card>

      <a href={`tel:${ownerPhone}`}>
        <button className="w-full rounded-lg bg-zinc-900 px-4 py-3.5 text-sm font-medium text-white">
          Call us
        </button>
      </a>
    </div>
  );
}
