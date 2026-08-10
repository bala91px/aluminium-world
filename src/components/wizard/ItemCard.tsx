"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/strings";
import { formatINR } from "@/lib/format";
import { getRateHint } from "@/lib/data";
import { ITEM_TYPES, OPENING_TYPES, SYSTEM_SERIES, GLASS_SPECS, FINISHES, HARDWARE } from "@/lib/options";
import { computeItemAmount, type ItemDraft } from "@/lib/wizard-types";
import type { RateHint } from "@/lib/data";

export function ItemCard({
  item,
  index,
  minBillableSqft,
  customerId,
  onChange,
  onRemove,
}: {
  item: ItemDraft;
  index: number;
  minBillableSqft: number;
  customerId?: string;
  onChange: (item: ItemDraft) => void;
  onRemove: () => void;
}) {
  const [hint, setHint] = useState<RateHint | null>(null);
  const { sqft, minimumApplied, amount } = computeItemAmount(item, minBillableSqft);

  useEffect(() => {
    let cancelled = false;
    getRateHint({
      itemType: item.item_type,
      openingType: item.opening_type,
      systemSeries: item.system_series,
      glassSpec: item.glass_spec,
      customerId,
    }).then((h) => {
      if (!cancelled) setHint(h);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.item_type, item.opening_type, item.system_series, item.glass_spec, customerId]);

  function set<K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) {
    onChange({ ...item, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted">Item {index + 1}</p>
        <button onClick={onRemove} className="text-xs text-status-blocked underline">
          {t.wizard.removeItem}
        </button>
      </div>

      <Row label={t.wizard.itemType}>
        <select className="input" value={item.item_type} onChange={(e) => set("item_type", e.target.value)}>
          {ITEM_TYPES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Row>

      <Row label={t.wizard.openingType}>
        <select className="input" value={item.opening_type} onChange={(e) => set("opening_type", e.target.value)}>
          {OPENING_TYPES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Row>

      <Row label={t.wizard.locationInHouse}>
        <input
          className="input"
          value={item.location_in_house}
          onChange={(e) => set("location_in_house", e.target.value)}
        />
      </Row>

      <div className="grid grid-cols-3 gap-2">
        <Row label={t.wizard.widthMm}>
          <input
            type="number"
            inputMode="numeric"
            className="input"
            value={item.width_mm}
            onChange={(e) => set("width_mm", Number(e.target.value) || 0)}
          />
        </Row>
        <Row label={t.wizard.heightMm}>
          <input
            type="number"
            inputMode="numeric"
            className="input"
            value={item.height_mm}
            onChange={(e) => set("height_mm", Number(e.target.value) || 0)}
          />
        </Row>
        <Row label={t.wizard.quantity}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            className="input"
            value={item.quantity}
            onChange={(e) => set("quantity", Math.max(1, Number(e.target.value) || 1))}
          />
        </Row>
      </div>

      <p className="text-sm text-muted">
        {t.wizard.area}: <span className="font-medium text-foreground">{sqft.toFixed(2)} sqft</span>
        {minimumApplied && (
          <span className="ml-2 rounded-full bg-status-progress-bg px-2 py-0.5 text-xs text-status-progress">
            {t.wizard.minimumApplied}
          </span>
        )}
      </p>

      <Row label={t.wizard.systemSeries}>
        <select className="input" value={item.system_series} onChange={(e) => set("system_series", e.target.value)}>
          {SYSTEM_SERIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Row>

      <Row label={t.wizard.glassSpec}>
        <select className="input" value={item.glass_spec} onChange={(e) => set("glass_spec", e.target.value)}>
          {GLASS_SPECS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Row>

      <Row label={t.wizard.finish}>
        <select className="input" value={item.finish} onChange={(e) => set("finish", e.target.value)}>
          {FINISHES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Row>

      <Row label={t.wizard.hardware}>
        <select className="input" value={item.hardware} onChange={(e) => set("hardware", e.target.value)}>
          {HARDWARE.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Row>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={item.mesh} onChange={(e) => set("mesh", e.target.checked)} />
        {t.wizard.mesh}
      </label>

      <Row label={t.wizard.rate}>
        <input
          type="number"
          inputMode="decimal"
          className="input"
          value={item.rate || ""}
          onChange={(e) => set("rate", Number(e.target.value) || 0)}
        />
      </Row>
      {hint && (
        <button
          type="button"
          onClick={() => set("rate", hint.rate)}
          className="-mt-2 self-start text-left text-xs text-accent underline"
        >
          {t.wizard.rateHint(String(hint.rate), hint.customerName, new Date(hint.quotedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }))}
        </button>
      )}

      <p className="text-sm font-medium">
        {formatINR(amount)}
      </p>

      <Row label={t.wizard.photos}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 4 - item.photos.length);
            if (files.length) set("photos", [...item.photos, ...files]);
          }}
          className="text-sm"
        />
        {item.photos.length > 0 && (
          <div className="mt-2 flex gap-2">
            {item.photos.map((f, i) => (
              <img
                key={i}
                src={URL.createObjectURL(f)}
                alt=""
                className="h-14 w-14 rounded-md object-cover"
              />
            ))}
          </div>
        )}
      </Row>

      <Row label={t.wizard.remarks}>
        <input className="input" value={item.remarks} onChange={(e) => set("remarks", e.target.value)} />
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
