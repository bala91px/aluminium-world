import Link from "next/link";
import { readDB } from "@/lib/db";
import { requireOwner } from "@/lib/session";
import { Badge, Card } from "@/components/ui";
import { formatDate, formatMoney, daysAgo } from "@/lib/format";
import SettingsPanel from "@/components/SettingsPanel";

export default async function ApprovalsPage() {
  await requireOwner();
  const db = readDB();
  const pending = db.quotes
    .filter((q) => q.status === "pending_approval")
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const recent = db.quotes
    .filter((q) => q.status !== "pending_approval")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-lg font-semibold text-zinc-900">Approval inbox</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {pending.length} quote{pending.length === 1 ? "" : "s"} waiting on you.
      </p>

      <div className="mb-8 flex flex-col gap-2">
        {pending.length === 0 && (
          <Card className="p-6 text-center text-sm text-zinc-500">Nothing waiting — inbox is clear.</Card>
        )}
        {pending.map((q) => {
          const cust = db.customers.find((c) => c.id === q.customerId);
          return (
            <Link href={`/quotes/${q.id}`} key={q.id}>
              <Card className="flex items-center justify-between p-4 hover:border-zinc-300">
                <div>
                  <p className="font-medium text-zinc-900">{q.quoteNo}</p>
                  <p className="text-sm text-zinc-500">
                    {cust?.name} · submitted {daysAgo(q.createdAt)}d ago
                  </p>
                </div>
                <span className="text-sm font-semibold text-zinc-900">{formatMoney(q.total)}</span>
              </Card>
            </Link>
          );
        })}
      </div>

      <SettingsPanel settings={db.settings} />

      <h2 className="mb-2 mt-8 text-sm font-semibold text-zinc-900">Recently decided</h2>
      <div className="flex flex-col gap-2">
        {recent.map((q) => {
          const cust = db.customers.find((c) => c.id === q.customerId);
          return (
            <Link href={`/quotes/${q.id}`} key={q.id}>
              <Card className="flex items-center justify-between p-3 text-sm hover:border-zinc-300">
                <span>{q.quoteNo} · {cust?.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-zinc-500">{formatDate(q.createdAt)}</span>
                  <Badge color={q.status === "rejected" ? "red" : "green"}>{q.status}</Badge>
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
