"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select, Textarea } from "./ui";
import { createQuote, getRateHint, searchCustomers } from "@/lib/actions";
import {
  ITEM_TYPES,
  OPENING_TYPES,
  SYSTEM_SERIES,
  GLASS_SPECS,
  FINISH_OPTIONS,
  HARDWARE_OPTIONS,
} from "@/lib/options";
import type {
  Customer,
  GlassSpec,
  ItemType,
  OpeningType,
  SystemSeries,
} from "@/lib/types";
import { formatMoney } from "@/lib/format";

type ItemDraft = {
  key: string;
  itemType: ItemType;
  openingType: OpeningType;
  locationInHouse: string;
  widthMm: string;
  heightMm: string;
  quantity: string;
  systemSeries: SystemSeries;
  glassSpec: GlassSpec;
  finish: string;
  hardware: string;
  mesh: boolean;
  rate: string;
  remarks: string;
  rateHint: string | null;
};

function newItem(): ItemDraft {
  return {
    key: Math.random().toString(36).slice(2),
    itemType: "Window",
    openingType: "Sliding (2 track)",
    locationInHouse: "",
    widthMm: "",
    heightMm: "",
    quantity: "1",
    systemSeries: "Local",
    glassSpec: "5mm clear",
    finish: "Powder coated",
    hardware: "Standard",
    mesh: false,
    rate: "",
    remarks: "",
    rateHint: null,
  };
}

function sqftFor(it: ItemDraft, minSqft: number) {
  const w = Number(it.widthMm) || 0;
  const h = Number(it.heightMm) || 0;
  const q = Number(it.quantity) || 0;
  const raw = (w * h) / 92903;
  const minApplied = raw > 0 && raw < minSqft;
  const sqft = (minApplied ? minSqft : raw) * q;
  return { sqft: Math.round(sqft * 100) / 100, minApplied };
}

const STEP_TITLES = ["Where", "Who", "Items", "Review & submit"];

export default function QuoteWizard({
  defaultAdvancePct,
  defaultGstPct,
  minBillableSqft,
}: {
  defaultAdvancePct: number;
  defaultGstPct: number;
  minBillableSqft: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ quoteNo: string } | null>(null);

  // Screen 1
  const [siteLabel, setSiteLabel] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  // Screen 2
  const [custMode, setCustMode] = useState<"existing" | "new">("existing");
  const [custQuery, setCustQuery] = useState("");
  const [custResults, setCustResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "", address: "" });

  // Screen 3
  const [items, setItems] = useState<ItemDraft[]>([newItem()]);

  // Screen 4
  const [discountValue, setDiscountValue] = useState("0");
  const [advancePct, setAdvancePct] = useState(String(defaultAdvancePct));
  const [leadTimeDays, setLeadTimeDays] = useState("18");
  const [terms, setTerms] = useState("Advance on approval, balance on delivery.");

  function updateItem(key: string, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  async function fetchRateHint(it: ItemDraft) {
    if (custMode !== "existing" || !selectedCustomer) return;
    const hint = await getRateHint(
      selectedCustomer.id,
      it.itemType,
      it.openingType,
      it.systemSeries,
      it.glassSpec,
    );
    updateItem(it.key, {
      rateHint: hint ? hint.label : null,
      rate: it.rate || (hint ? String(hint.rate) : it.rate),
    });
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("done");
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function runCustomerSearch(q: string) {
    setCustQuery(q);
    const results = await searchCustomers(q);
    setCustResults(results);
  }

  const subtotal = items.reduce((s, it) => {
    const { sqft } = sqftFor(it, minBillableSqft);
    return s + sqft * (Number(it.rate) || 0);
  }, 0);
  const afterDiscount = subtotal - (Number(discountValue) || 0);
  const total = Math.round(afterDiscount * (1 + defaultGstPct / 100));
  const advanceAmount = Math.round(total * ((Number(advancePct) || 0) / 100));

  function canNext(): boolean {
    if (step === 1) return siteLabel.trim().length > 0;
    if (step === 2) {
      if (custMode === "existing") return !!selectedCustomer;
      return newCustomer.name.trim().length > 0 && /^\d{10}$/.test(newCustomer.mobile);
    }
    if (step === 3) {
      return items.every(
        (it) =>
          it.locationInHouse.trim() &&
          Number(it.widthMm) > 0 &&
          Number(it.heightMm) > 0 &&
          Number(it.quantity) > 0 &&
          Number(it.rate) > 0,
      );
    }
    return true;
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createQuote({
        customerId: custMode === "existing" ? selectedCustomer?.id : undefined,
        newCustomer: custMode === "new" ? newCustomer : undefined,
        siteLabel,
        capturedAddress: gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : undefined,
        lat: gps?.lat,
        lng: gps?.lng,
        items: items.map((it) => ({
          itemType: it.itemType,
          openingType: it.openingType,
          locationInHouse: it.locationInHouse,
          widthMm: Number(it.widthMm),
          heightMm: Number(it.heightMm),
          quantity: Number(it.quantity),
          systemSeries: it.systemSeries,
          glassSpec: it.glassSpec,
          finish: it.finish,
          hardware: it.hardware,
          mesh: it.mesh,
          rate: Number(it.rate),
          remarks: it.remarks || undefined,
        })),
        discountValue: Number(discountValue) || 0,
        advancePct: Number(advancePct) || 0,
        leadTimeDays: Number(leadTimeDays) || 0,
        terms,
      });
      setDone({ quoteNo: res.quoteNo });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </div>
        <h1 className="text-lg font-semibold text-zinc-900">Quote created</h1>
        <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">{done.quoteNo}</p>
        <p className="mt-2 text-sm text-zinc-500">
          It now sits in Arif&rsquo;s approval inbox.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Button onClick={() => router.push("/quotes")}>Go to my quotes</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDone(null);
              setStep(1);
              setSiteLabel("");
              setGps(null);
              setGpsStatus("idle");
              setSelectedCustomer(null);
              setCustQuery("");
              setItems([newItem()]);
            }}
          >
            Create another quote
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-28">
      <div className="mb-6 flex items-center gap-2">
        {STEP_TITLES.map((title, i) => (
          <div key={title} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i + 1 === step
                  ? "bg-zinc-900 text-white"
                  : i + 1 < step
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {i + 1 < step ? "✓" : i + 1}
            </div>
            {i < STEP_TITLES.length - 1 && <div className="h-px flex-1 bg-zinc-200" />}
          </div>
        ))}
      </div>
      <h1 className="mb-4 text-lg font-semibold text-zinc-900">{STEP_TITLES[step - 1]}</h1>

      {step === 1 && (
        <Card className="p-4">
          <div className="mb-4">
            <Button type="button" variant="secondary" className="w-full" onClick={captureLocation}>
              {gpsStatus === "loading" ? "Capturing location…" : gpsStatus === "done" ? "Location captured ✓" : "📍 Capture site location"}
            </Button>
            {gpsStatus === "done" && gps && (
              <p className="mt-2 text-xs text-zinc-500">{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</p>
            )}
            {gpsStatus === "error" && (
              <p className="mt-2 text-xs text-amber-600">Couldn&rsquo;t get GPS — you can still type the site below.</p>
            )}
          </div>
          <Label>Site label</Label>
          <Input
            placeholder='e.g. "Meethal house, Meppadi"'
            value={siteLabel}
            onChange={(e) => setSiteLabel(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            This prints on the quote. Overwrite the GPS name with what you&rsquo;d actually call it.
          </p>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-4">
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={custMode === "existing" ? "primary" : "secondary"}
              onClick={() => setCustMode("existing")}
            >
              Existing customer
            </Button>
            <Button
              type="button"
              size="sm"
              variant={custMode === "new" ? "primary" : "secondary"}
              onClick={() => setCustMode("new")}
            >
              New customer
            </Button>
          </div>

          {custMode === "existing" ? (
            <>
              <Label>Search by name or mobile</Label>
              <Input
                value={custQuery}
                onChange={(e) => runCustomerSearch(e.target.value)}
                placeholder="Rasheed, 97440…"
              />
              <div className="mt-2 flex flex-col gap-1.5">
                {custResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCustomer(c)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm ${
                      selectedCustomer?.id === c.id
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <span>
                      <span className="font-medium text-zinc-900">{c.name}</span>
                      <span className="ml-2 text-zinc-500">{c.mobile}</span>
                    </span>
                    {selectedCustomer?.id === c.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <Label>Name</Label>
                <Input value={newCustomer.name} onChange={(e) => setNewCustomer((c) => ({ ...c, name: e.target.value }))} />
              </div>
              <div>
                <Label>Mobile (10 digits)</Label>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  value={newCustomer.mobile}
                  onChange={(e) => setNewCustomer((c) => ({ ...c, mobile: e.target.value.replace(/\D/g, "") }))}
                />
              </div>
              <div>
                <Label>Address (optional)</Label>
                <Input value={newCustomer.address} onChange={(e) => setNewCustomer((c) => ({ ...c, address: e.target.value }))} />
              </div>
            </div>
          )}
        </Card>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          {items.map((it, idx) => {
            const { sqft, minApplied } = sqftFor(it, minBillableSqft);
            return (
              <Card key={it.key} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() => setItems((prev) => prev.filter((p) => p.key !== it.key))}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={it.itemType} onChange={(e) => updateItem(it.key, { itemType: e.target.value as ItemType })}>
                      {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Opening</Label>
                    <Select value={it.openingType} onChange={(e) => updateItem(it.key, { openingType: e.target.value as OpeningType })}>
                      {OPENING_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Location in house</Label>
                    <Input
                      placeholder="Bedroom 1"
                      value={it.locationInHouse}
                      onChange={(e) => updateItem(it.key, { locationInHouse: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Width (mm)</Label>
                    <Input inputMode="numeric" value={it.widthMm} onChange={(e) => updateItem(it.key, { widthMm: e.target.value.replace(/\D/g, "") })} />
                  </div>
                  <div>
                    <Label>Height (mm)</Label>
                    <Input inputMode="numeric" value={it.heightMm} onChange={(e) => updateItem(it.key, { heightMm: e.target.value.replace(/\D/g, "") })} />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input inputMode="numeric" value={it.quantity} onChange={(e) => updateItem(it.key, { quantity: e.target.value.replace(/\D/g, "") })} />
                  </div>
                  <div className="flex items-end">
                    <p className="text-sm text-zinc-600">
                      = <span className="font-semibold text-zinc-900">{sqft || 0} sqft</span>
                      {minApplied && <span className="ml-1 text-amber-600">(min applied)</span>}
                    </p>
                  </div>
                  <div>
                    <Label>System</Label>
                    <Select
                      value={it.systemSeries}
                      onChange={(e) => {
                        const v = e.target.value as SystemSeries;
                        updateItem(it.key, { systemSeries: v });
                        fetchRateHint({ ...it, systemSeries: v });
                      }}
                    >
                      {SYSTEM_SERIES.map((t) => <option key={t}>{t}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Glass</Label>
                    <Select
                      value={it.glassSpec}
                      onChange={(e) => {
                        const v = e.target.value as GlassSpec;
                        updateItem(it.key, { glassSpec: v });
                        fetchRateHint({ ...it, glassSpec: v });
                      }}
                    >
                      {GLASS_SPECS.map((t) => <option key={t}>{t}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Finish</Label>
                    <Select value={it.finish} onChange={(e) => updateItem(it.key, { finish: e.target.value })}>
                      {FINISH_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Hardware</Label>
                    <Select value={it.hardware} onChange={(e) => updateItem(it.key, { hardware: e.target.value })}>
                      {HARDWARE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                    </Select>
                  </div>
                  <label className="col-span-2 flex items-center gap-2 text-sm text-zinc-700">
                    <input type="checkbox" checked={it.mesh} onChange={(e) => updateItem(it.key, { mesh: e.target.checked })} />
                    Mosquito mesh included
                  </label>
                  <div className="col-span-2">
                    <Label>Rate (₹/sqft)</Label>
                    <Input inputMode="numeric" value={it.rate} onChange={(e) => updateItem(it.key, { rate: e.target.value.replace(/\D/g, "") })} />
                    {it.rateHint && <p className="mt-1 text-xs text-emerald-700">{it.rateHint}</p>}
                  </div>
                  <div className="col-span-2">
                    <Label>Remarks (optional)</Label>
                    <Input value={it.remarks} onChange={(e) => updateItem(it.key, { remarks: e.target.value })} />
                  </div>
                </div>
              </Card>
            );
          })}
          <Button type="button" variant="secondary" onClick={() => setItems((prev) => [...prev, newItem()])}>
            + Add another item
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">Line items</h2>
            <div className="flex flex-col gap-2 text-sm">
              {items.map((it, i) => {
                const { sqft } = sqftFor(it, minBillableSqft);
                return (
                  <div key={it.key} className="flex justify-between border-b border-zinc-100 pb-2 last:border-0">
                    <span className="text-zinc-600">
                      {i + 1}. {it.itemType} — {it.locationInHouse || "—"} ({sqft} sqft × ₹{it.rate || 0})
                    </span>
                    <span className="font-medium text-zinc-900">{formatMoney(sqft * (Number(it.rate) || 0))}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount (₹)</Label>
                <Input inputMode="numeric" value={discountValue} onChange={(e) => setDiscountValue(e.target.value.replace(/\D/g, ""))} />
              </div>
              <div>
                <Label>Advance %</Label>
                <Input inputMode="numeric" value={advancePct} onChange={(e) => setAdvancePct(e.target.value.replace(/\D/g, ""))} />
              </div>
              <div>
                <Label>Lead time (days)</Label>
                <Input inputMode="numeric" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value.replace(/\D/g, ""))} />
              </div>
              <div>
                <Label>GST</Label>
                <Input disabled value={`${defaultGstPct}%`} />
              </div>
              <div className="col-span-2">
                <Label>Terms</Label>
                <Textarea rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-zinc-600"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
              <div className="flex justify-between text-zinc-600"><span>Discount</span><span>-{formatMoney(Number(discountValue) || 0)}</span></div>
              <div className="flex justify-between text-zinc-600"><span>GST ({defaultGstPct}%)</span><span>{formatMoney(total - afterDiscount)}</span></div>
              <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-base font-semibold text-zinc-900">
                <span>Total</span><span>{formatMoney(total)}</span>
              </div>
              <div className="flex justify-between font-medium text-emerald-700">
                <span>Advance due ({advancePct}%)</span><span>{formatMoney(advanceAmount)}</span>
              </div>
            </div>
          </Card>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white p-4">
        <div className="mx-auto flex max-w-lg gap-3">
          {step > 1 && (
            <Button variant="secondary" className="flex-1" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button className="flex-1" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button className="flex-1" disabled={submitting} onClick={submit}>
              {submitting ? "Submitting…" : "Submit quote"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
