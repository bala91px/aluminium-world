"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { t } from "@/lib/strings";
import { getSettings, updateSettings } from "@/lib/data";
import type { ApprovalMode, Settings } from "@/lib/types";

export default function SettingsPage() {
  const { profile } = useSession();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!profile) return null;

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    await updateSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-md">
        <h1 className="mb-5 text-lg font-semibold">{t.nav.settings}</h1>

        {!settings ? (
          <p className="text-sm text-muted">{t.common.notConfigured}</p>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-sm font-medium text-muted">{t.approvals.approvalMode}</p>
              <div className="flex flex-col gap-2">
                {(
                  [
                    ["always", t.approvals.modeAlways],
                    ["threshold", t.approvals.modeThreshold],
                    ["never", t.approvals.modeNever],
                  ] as [ApprovalMode, string][]
                ).map(([mode, label]) => (
                  <label
                    key={mode}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                      settings.approval_mode === mode ? "border-accent bg-status-pending-bg" : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={settings.approval_mode === mode}
                      onChange={() => setSettings({ ...settings, approval_mode: mode })}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {settings.approval_mode === "threshold" && (
              <>
                <Field label={t.approvals.thresholdAmount}>
                  <input
                    type="number"
                    className="input"
                    value={settings.threshold_amount}
                    onChange={(e) =>
                      setSettings({ ...settings, threshold_amount: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label={`${t.approvals.marginFlag} — discount %`}>
                  <input
                    type="number"
                    className="input"
                    value={settings.discount_threshold_pct}
                    onChange={(e) =>
                      setSettings({ ...settings, discount_threshold_pct: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
              </>
            )}

            <Field label="Minimum billable area (sqft)">
              <input
                type="number"
                className="input"
                value={settings.min_billable_sqft}
                onChange={(e) => setSettings({ ...settings, min_billable_sqft: Number(e.target.value) || 0 })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Default GST %">
                <input
                  type="number"
                  className="input"
                  value={settings.default_gst_pct}
                  onChange={(e) => setSettings({ ...settings, default_gst_pct: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Default advance %">
                <input
                  type="number"
                  className="input"
                  value={settings.default_advance_pct}
                  onChange={(e) => setSettings({ ...settings, default_advance_pct: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>

            <Field label="Business name">
              <input
                className="input"
                value={settings.business_name}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
              />
            </Field>
            <Field label="Address">
              <input
                className="input"
                value={settings.address ?? ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className="input"
                value={settings.phone ?? ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              />
            </Field>

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground disabled:opacity-50"
            >
              {saved ? "Saved" : saving ? t.common.loading : t.common.save}
            </button>
          </div>
        )}
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
