"use client";

import { t } from "@/lib/strings";
import { formatINR } from "@/lib/format";
import { emptyItem, computeItemAmount, type ItemDraft } from "@/lib/wizard-types";
import { ItemCard } from "./ItemCard";

export function WizardStep3({
  items,
  setItems,
  minBillableSqft,
  customerId,
  onNext,
  onBack,
}: {
  items: ItemDraft[];
  setItems: (items: ItemDraft[]) => void;
  minBillableSqft: number;
  customerId?: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const subtotal = items.reduce(
    (sum, i) => sum + computeItemAmount(i, minBillableSqft).amount,
    0
  );
  const canProceed = items.length > 0 && items.every((i) => i.rate > 0 && i.location_in_house.trim());

  function update(index: number, next: ItemDraft) {
    const copy = [...items];
    copy[index] = next;
    setItems(copy);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{t.wizard.step3Title}</h2>
        <p className="text-sm text-muted">{t.wizard.step3Subtitle}</p>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <ItemCard
            key={item.localId}
            item={item}
            index={i}
            minBillableSqft={minBillableSqft}
            customerId={customerId}
            onChange={(next) => update(i, next)}
            onRemove={() => setItems(items.filter((_, idx) => idx !== i))}
          />
        ))}
      </div>

      <button
        onClick={() => setItems([...items, emptyItem()])}
        className="rounded-lg border border-dashed border-border py-3 text-sm font-medium text-muted hover:border-accent hover:text-accent"
      >
        {t.wizard.addItem}
      </button>

      {items.length > 0 && (
        <p className="text-right text-sm font-medium">
          {t.wizard.subtotal}: {formatINR(subtotal)}
        </p>
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
