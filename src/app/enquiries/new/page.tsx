"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { t } from "@/lib/strings";
import { createEnquiry, listSupervisors } from "@/lib/data";
import type { EnquirySource, Profile } from "@/lib/types";

const SOURCES: { value: EnquirySource; label: string }[] = [
  { value: "phone_call", label: "Phone call" },
  { value: "walk_in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

export default function NewEnquiryPage() {
  const { profile } = useSession();
  const router = useRouter();
  const [supervisors, setSupervisors] = useState<Profile[]>([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [source, setSource] = useState<EnquirySource>("phone_call");
  const [roughNeed, setRoughNeed] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listSupervisors().then(setSupervisors);
  }, []);

  if (!profile) return null;

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const result = await createEnquiry({
      customer_name: name,
      customer_mobile: mobile,
      source,
      rough_need: roughNeed || undefined,
      assigned_supervisor: assignedTo || null,
      created_by: profile.id,
    });
    setSaving(false);
    if (result) router.replace("/enquiries");
  }

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-md">
        <h1 className="mb-1 text-lg font-semibold">{t.enquiry.title}</h1>
        <p className="mb-5 text-sm text-muted">{t.enquiry.subtitle}</p>

        <div className="flex flex-col gap-4">
          <Field label={t.enquiry.customerName}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder={t.wizard.customerNamePlaceholder}
            />
          </Field>
          <Field label={t.enquiry.customerMobile}>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="numeric"
              maxLength={10}
              className="input"
              placeholder={t.wizard.customerMobilePlaceholder}
            />
          </Field>
          <Field label={t.enquiry.source}>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as EnquirySource)}
              className="input"
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.enquiry.roughNeed}>
            <textarea
              value={roughNeed}
              onChange={(e) => setRoughNeed(e.target.value)}
              className="input min-h-20"
            />
          </Field>
          <Field label={t.enquiry.assignTo}>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="input"
            >
              <option value="">—</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <button
            onClick={handleSave}
            disabled={!name || mobile.length !== 10 || saving}
            className="mt-2 rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground disabled:opacity-50"
          >
            {saving ? t.common.loading : t.enquiry.save}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
