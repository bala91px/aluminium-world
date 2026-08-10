"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { t } from "@/lib/strings";
import { listCustomers } from "@/lib/data";
import { waLink } from "@/lib/whatsapp";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const { profile } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    listCustomers().then((rows) => {
      setCustomers(rows);
      setLoading(false);
    });
  }, [profile]);

  if (!profile) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) || c.mobile.includes(query)
  );

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-lg font-semibold">{t.nav.customers}</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.wizard.searchCustomer}
          className="input mb-4"
        />

        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted">{c.mobile}</p>
                  {c.address && <p className="text-xs text-muted">{c.address}</p>}
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${c.mobile}`} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium">
                    Call
                  </a>
                  <a
                    href={waLink(c.mobile, `Hello ${c.name}, `)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                  >
                    WhatsApp
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
