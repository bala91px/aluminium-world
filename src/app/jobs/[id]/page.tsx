import { notFound } from "next/navigation";
import { readDB } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card } from "@/components/ui";
import { JOB_STATUS_COLOR, JOB_STATUS_LABEL } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";
import StageTimeline from "@/components/StageTimeline";
import JobStageControls from "@/components/JobStageControls";
import { ShareTracker, RecordBalance } from "@/components/JobActions";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const db = readDB();
  const job = db.jobs.find((j) => j.id === id);
  if (!job) notFound();

  const customer = db.customers.find((c) => c.id === job.customerId);
  const site = db.sites.find((s) => s.id === job.siteId);
  const quote = db.quotes.find((q) => q.id === job.quoteId);
  const paid = db.payments.filter((p) => p.jobId === job.id).reduce((s, p) => s + p.amount, 0);
  const total = quote?.total ?? 0;
  const balanceDue = Math.max(total - paid, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">{job.jobNo}</h1>
          <p className="text-sm text-zinc-500">{customer?.name} · {customer?.mobile}</p>
          <p className="text-sm text-zinc-500">{site?.label}</p>
        </div>
        <Badge color={JOB_STATUS_COLOR[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-zinc-600"><span>Total</span><span className="font-medium text-zinc-900">{formatMoney(total)}</span></div>
          <div className="flex justify-between text-zinc-600"><span>Paid so far</span><span>{formatMoney(paid)}</span></div>
          <div className="flex justify-between text-zinc-600"><span>Balance</span><span>{formatMoney(balanceDue)}</span></div>
          <div className="flex justify-between text-zinc-500"><span>Promised delivery</span><span>{formatDate(job.promisedDate)}</span></div>
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Update stage</h2>
        <JobStageControls jobId={job.id} stages={job.stages} />
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Customer tracker link</h2>
        {customer && <ShareTracker token={job.publicToken} mobile={customer.mobile} jobNo={job.jobNo} />}
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Balance payment</h2>
        <RecordBalance jobId={job.id} balanceDue={balanceDue} />
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Progress</h2>
        <StageTimeline stages={job.stages} />
      </Card>
    </div>
  );
}
