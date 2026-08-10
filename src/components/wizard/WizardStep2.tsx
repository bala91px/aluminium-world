"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/strings";
import { searchCustomers } from "@/lib/data";
import type { Customer } from "@/lib/types";

export function WizardStep2({
  selected,
  setSelected,
  newCustomer,
  setNewCustomer,
  onNext,
  onBack,
}: {
  selected: Customer | null;
  setSelected: (c: Customer | null) => void;
  newCustomer: { name: string; mobile: string; address: string };
  setNewCustomer: (c: { name: string; mobile: string; address: string }) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [addingNew, setAddingNew] = useState(false);

  useEffect(() => {
    if (selected || addingNew) return;
    const handle = setTimeout(() => {
      searchCustomers(query).then(setResults);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, selected, addingNew]);

  const canProceed = selected || (newCustomer.name && newCustomer.mobile.length === 10);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{t.wizard.step2Title}</h2>
        <p className="text-sm text-muted">{t.wizard.step2Subtitle}</p>
      </div>

      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-accent bg-status-pending-bg p-4">
          <div>
            <p className="font-medium">{selected.name}</p>
            <p className="text-sm text-muted">{selected.mobile}</p>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="text-sm font-medium text-accent underline"
          >
            {t.common.cancel}
          </button>
        </div>
      ) : addingNew ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <input
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            placeholder={t.wizard.customerNamePlaceholder}
            className="input"
          />
          <input
            value={newCustomer.mobile}
            onChange={(e) =>
              setNewCustomer({ ...newCustomer, mobile: e.target.value.replace(/\D/g, "") })
            }
            inputMode="numeric"
            maxLength={10}
            placeholder={t.wizard.customerMobilePlaceholder}
            className="input"
          />
          <input
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            placeholder={t.wizard.customerAddressPlaceholder}
            className="input"
          />
          <button
            onClick={() => setAddingNew(false)}
            className="self-start text-sm text-muted underline"
          >
            {t.common.cancel}
          </button>
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.wizard.searchCustomer}
            className="input"
          />
          {results.length > 0 && (
            <ul className="flex flex-col gap-1">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelected(c)}
                    className="w-full rounded-lg border border-border bg-surface p-3 text-left hover:border-accent"
                  >
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted">{c.mobile}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => setAddingNew(true)}
            className="self-start text-sm font-medium text-accent underline"
          >
            {t.wizard.addNewCustomer}
          </button>
        </>
      )}

      <div className="mt-2 flex gap-3">
        <button onClick={onBack} className="rounded-lg border border-border px-4 py-3 font-medium">
          {t.common.back}
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground disabled:opacity-50"
        >
          {t.wizard.next}
        </button>
      </div>
    </div>
  );
}
