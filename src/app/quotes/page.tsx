import Link from "next/link";
import { readDB } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card } from "@/components/ui";
import { QUOTE_STATUS_COLOR, QUOTE_STATUS_LABEL } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/format";

export default async function QuotesPage() {
  const user = await requireUser();
  const db = readDB();
  const quotes = (user.role === "owner" ? db.quotes : db.quotes.filter((q) => q.createdBy === user.id))
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">
          {user.role === "owner" ? "All quotes" : "My quotes"}
        </h1>
        {user.role === "supervisor" && (
          <Link href="/quotes/new" className="text-sm font-medium text-zinc-900 underline">
            + New quote
          </Link>
        )}
      </div>

      {quotes.length === 0 && (
        <Card className="p-8 text-center text-sm text-zinc-500">No quotes yet.</Card>
      )}

      <div className="flex flex-col gap-2">
        {quotes.map((q) => {
          const cust = db.customers.find((c) => c.id === q.customerId);
          return (
            <Link href={`/quotes/${q.id}`} key={q.id}>
              <Card className="flex items-center justify-between p-4 hover:border-zinc-300">
                <div>
                  <p className="font-medium text-zinc-900">{q.quoteNo}</p>
                  <p className="text-sm text-zinc-500">
                    {cust?.name} · {formatDate(q.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-900">{formatMoney(q.total)}</span>
                  <Badge color={QUOTE_STATUS_COLOR[q.status]}>{QUOTE_STATUS_LABEL[q.status]}</Badge>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
