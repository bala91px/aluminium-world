import Link from "next/link";
import { readDB } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card } from "@/components/ui";
import { JOB_STATUS_COLOR, JOB_STATUS_LABEL } from "@/lib/status";
import { formatDate } from "@/lib/format";

export default async function JobsPage() {
  const user = await requireUser();
  const db = readDB();
  const jobs = (user.role === "owner" ? db.jobs : db.jobs.filter((j) => j.assignedSupervisor === user.id))
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-lg font-semibold text-zinc-900">
        {user.role === "owner" ? "All jobs" : "My jobs"}
      </h1>
      <div className="flex flex-col gap-2">
        {jobs.map((j) => {
          const cust = db.customers.find((c) => c.id === j.customerId);
          const currentStage = j.stages.find((s) => s.status === "in_progress" || s.status === "blocked");
          return (
            <Link href={`/jobs/${j.id}`} key={j.id}>
              <Card className="flex items-center justify-between p-4 hover:border-zinc-300">
                <div>
                  <p className="font-medium text-zinc-900">{j.jobNo} · {cust?.name}</p>
                  <p className="text-sm text-zinc-500">
                    {currentStage ? currentStage.label : "Complete"} · promised {formatDate(j.promisedDate)}
                  </p>
                </div>
                <Badge color={JOB_STATUS_COLOR[j.status]}>{JOB_STATUS_LABEL[j.status]}</Badge>
              </Card>
            </Link>
          );
        })}
        {jobs.length === 0 && <Card className="p-8 text-center text-sm text-zinc-500">No jobs yet.</Card>}
      </div>
    </div>
  );
}
