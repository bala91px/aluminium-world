"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { WizardStep1 } from "@/components/wizard/WizardStep1";
import { WizardStep2 } from "@/components/wizard/WizardStep2";
import { WizardStep3 } from "@/components/wizard/WizardStep3";
import { WizardStep4 } from "@/components/wizard/WizardStep4";
import { t } from "@/lib/strings";
import {
  createCustomer,
  createQuoteWithItems,
  createSite,
  decideApprovalStatus,
  getSettings,
} from "@/lib/data";
import { getCurrentPosition, reverseGeocode } from "@/lib/geocode";
import { computeItemAmount, type ItemDraft } from "@/lib/wizard-types";
import type { Customer, Settings } from "@/lib/types";

function NewQuoteWizard() {
  const { profile } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<Settings | null>(null);

  const [siteLabel, setSiteLabel] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [capturedAddress, setCapturedAddress] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "", address: "" });

  const [items, setItems] = useState<ItemDraft[]>([]);

  const [discountType, setDiscountType] = useState<"amount" | "percent" | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [gstPct, setGstPct] = useState(18);
  const [advancePct, setAdvancePct] = useState(50);
  const [leadTimeDays, setLeadTimeDays] = useState(14);
  const [terms, setTerms] = useState("Advance non-refundable. Delivery timeline starts from advance receipt.");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ quoteNo: string; status: string } | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        setGstPct(s.default_gst_pct);
        setAdvancePct(s.default_advance_pct);
      }
      setSettings(s);
    });
    const prefName = params.get("name");
    const prefMobile = params.get("mobile");
    if (prefName) setNewCustomer((c) => ({ ...c, name: prefName, mobile: prefMobile ?? "" }));
  }, [params]);

  const minBillableSqft = settings?.min_billable_sqft ?? 10;

  async function handleUseGps() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setCapturedAddress(address);
    } catch (err) {
      console.error(err);
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit() {
    if (!profile) return;
    setSubmitting(true);

    let customerId = selectedCustomer?.id;
    if (!customerId) {
      const created = await createCustomer(newCustomer);
      if (!created) {
        setSubmitting(false);
        return;
      }
      customerId = created.id;
    }

    const site = await createSite({
      customer_id: customerId,
      label: siteLabel,
      lat,
      lng,
      captured_address: capturedAddress,
    });
    if (!site) {
      setSubmitting(false);
      return;
    }

    const subtotal = items.reduce((s, i) => s + computeItemAmount(i, minBillableSqft).amount, 0);
    const discountAmount =
      discountType === "percent" ? (subtotal * discountValue) / 100 : discountType === "amount" ? discountValue : 0;
    const afterDiscount = Math.max(subtotal - discountAmount, 0);
    const gstAmount = (afterDiscount * gstPct) / 100;
    const total = Math.round(afterDiscount + gstAmount);
    const advanceAmount = Math.round((total * advancePct) / 100);
    const discountPct = discountType === "percent" ? discountValue : subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;

    const status = decideApprovalStatus(settings, total, discountPct);

    const itemsPayload = items.map((item, i) => {
      const { sqft, amount } = computeItemAmount(item, minBillableSqft);
      return {
        item_type: item.item_type,
        opening_type: item.opening_type,
        location_in_house: item.location_in_house,
        width_mm: item.width_mm,
        height_mm: item.height_mm,
        quantity: item.quantity,
        sqft,
        system_series: item.system_series,
        glass_spec: item.glass_spec,
        finish: item.finish,
        hardware: item.hardware,
        mesh: item.mesh,
        rate: item.rate,
        amount,
        remarks: item.remarks || undefined,
        sort_order: i,
        photos: item.photos,
      };
    });

    const quote = await createQuoteWithItems({
      customer_id: customerId,
      site_id: site.id,
      created_by: profile.id,
      status,
      subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      gst_pct: gstPct,
      total,
      advance_pct: advancePct,
      advance_amount: advanceAmount,
      lead_time_days: leadTimeDays,
      terms,
      items: itemsPayload,
      enquiryId: params.get("enquiryId") ?? undefined,
    });

    setSubmitting(false);
    if (quote) {
      setResult({ quoteNo: quote.quote_no, status: quote.status });
    }
  }

  if (!profile) return null;

  if (result) {
    return (
      <AppShell profile={profile}>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-semibold">{t.quote.createdSuccess(result.quoteNo)}</h1>
          <p className="text-sm text-muted">
            {result.status === "approved" ? t.quote.status.approved : t.quote.sendToOwner}
          </p>
          <button
            onClick={() => router.push("/quotes")}
            className="rounded-lg bg-accent px-5 py-3 font-medium text-accent-foreground"
          >
            {t.nav.quotes}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-md">
        <StepDots step={step} />
        {step === 1 && (
          <WizardStep1
            siteLabel={siteLabel}
            setSiteLabel={setSiteLabel}
            capturedAddress={capturedAddress}
            locating={locating}
            onUseGps={handleUseGps}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <WizardStep2
            selected={selectedCustomer}
            setSelected={setSelectedCustomer}
            newCustomer={newCustomer}
            setNewCustomer={setNewCustomer}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <WizardStep3
            items={items}
            setItems={setItems}
            minBillableSqft={minBillableSqft}
            customerId={selectedCustomer?.id}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <WizardStep4
            items={items}
            minBillableSqft={minBillableSqft}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            gstPct={gstPct}
            setGstPct={setGstPct}
            advancePct={advancePct}
            setAdvancePct={setAdvancePct}
            leadTimeDays={leadTimeDays}
            setLeadTimeDays={setLeadTimeDays}
            terms={terms}
            setTerms={setTerms}
            submitting={submitting}
            onSubmit={handleSubmit}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </AppShell>
  );
}

function StepDots({ step }: { step: number }) {
  return (
    <div className="mb-5 flex gap-1.5">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-accent" : "bg-border"}`}
        />
      ))}
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={null}>
      <NewQuoteWizard />
    </Suspense>
  );
}
