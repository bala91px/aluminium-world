"use client";

import { t } from "@/lib/strings";
import { formatINR } from "@/lib/format";
import { computeItemAmount, type ItemDraft } from "@/lib/wizard-types";

export function WizardStep4({
  items,
  minBillableSqft,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  gstPct,
  setGstPct,
  advancePct,
  setAdvancePct,
  leadTimeDays,
  setLeadTimeDays,
  terms,
  setTerms,
  submitting,
  onSubmit,
  onBack,
}: {
  items: ItemDraft[];
  minBillableSqft: number;
  discountType: "amount" | "percent" | null;
  setDiscountType: (v: "amount" | "percent" | null) => void;
  discountValue: number;
  setDiscountValue: (v: number) => void;
  gstPct: number;
  setGstPct: (v: number) => void;
  advancePct: number;
  setAdvancePct: (v: number) => void;
  leadTimeDays: number;
  setLeadTimeDays: (v: number) => void;
  terms: string;
  setTerms: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const subtotal = items.reduce((s, i) => s + computeItemAmount(i, minBillableSqft).amount, 0);
  const discountAmount =
    discountType === "percent" ? (subtotal * discountValue) / 100 : discountType === "amount" ? discountValue : 0;
  const afterDiscount = Math.max(subtotal - discountAmount, 0);
  const gstAmount = (afterDiscount * gstPct) / 100;
  const total = Math.round(afterDiscount + gstAmount);
  const advanceAmount = Math.round((total * advancePct) / 100);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{t.wizard.step4Title}</h2>
        <p className="text-sm text-muted">{t.wizard.step4Subtitle}</p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-sm">
        {items.map((item) => {
          const { sqft, amount } = computeItemAmount(item, minBillableSqft);
          return (
            <div key={item.localId} className="flex justify-between border-b border-border pb-2 last:border-0">
              <span className="text-muted">
                {item.item_type} · {item.location_in_house || "—"} · {sqft.toFixed(1)} sqft
              </span>
              <span className="font-medium">{formatINR(amount)}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">{t.wizard.discount}</span>
          <div className="flex gap-2">
            <select
              className="input"
              value={discountType ?? ""}
              onChange={(e) => setDiscountType((e.target.value || null) as "amount" | "percent" | null)}
            >
              <option value="">—</option>
              <option value="amount">₹</option>
              <option value="percent">%</option>
            </select>
            <input
              type="number"
              className="input"
              value={discountValue || ""}
              onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
              disabled={!discountType}
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">{t.wizard.gst}</span>
          <input
            type="number"
            className="input"
            value={gstPct}
            onChange={(e) => setGstPct(Number(e.target.value) || 0)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">{t.wizard.advancePct}</span>
          <input
            type="number"
            className="input"
            value={advancePct}
            onChange={(e) => setAdvancePct(Number(e.target.value) || 0)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">{t.wizard.leadTime}</span>
          <input
            type="number"
            className="input"
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-muted">{t.wizard.terms}</span>
        <textarea className="input min-h-16" value={terms} onChange={(e) => setTerms(e.target.value)} />
      </label>

      <div className="flex flex-col gap-1 rounded-xl bg-status-pending-bg p-4 text-sm">
        <Line label={t.wizard.subtotal} value={formatINR(subtotal)} />
        {discountType && <Line label={t.wizard.discount} value={`- ${formatINR(discountAmount)}`} />}
        <Line label={t.wizard.gst} value={formatINR(gstAmount)} />
        <Line label={t.wizard.total} value={formatINR(total)} bold />
        <Line label={t.wizard.advanceAmount} value={formatINR(advanceAmount)} bold />
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="rounded-lg border border-border px-4 py-3 font-medium" disabled={submitting}>
          {t.common.back}
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground disabled:opacity-50"
        >
          {submitting ? t.wizard.submitting : t.wizard.submit}
        </button>
      </div>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
