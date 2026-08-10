"use client";

import { t } from "@/lib/strings";

export function WizardStep1({
  siteLabel,
  setSiteLabel,
  capturedAddress,
  locating,
  onUseGps,
  onNext,
}: {
  siteLabel: string;
  setSiteLabel: (v: string) => void;
  capturedAddress: string | null;
  locating: boolean;
  onUseGps: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{t.wizard.step1Title}</h2>
        <p className="text-sm text-muted">{t.wizard.step1Subtitle}</p>
      </div>

      <button
        onClick={onUseGps}
        disabled={locating}
        className="rounded-lg border border-border bg-surface px-4 py-3 text-left font-medium disabled:opacity-60"
      >
        {locating ? t.wizard.locating : `📍 ${t.wizard.useGps}`}
      </button>

      {capturedAddress && (
        <p className="rounded-lg bg-status-pending-bg p-3 text-sm text-muted">
          {t.wizard.capturedAddress}: {capturedAddress}
        </p>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-muted">
          {t.wizard.siteLabel}
        </span>
        <input
          value={siteLabel}
          onChange={(e) => setSiteLabel(e.target.value)}
          placeholder={t.wizard.siteLabelPlaceholder}
          className="input"
        />
      </label>

      <button
        onClick={onNext}
        disabled={!siteLabel.trim()}
        className="mt-2 rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground disabled:opacity-50"
      >
        {t.wizard.next}
      </button>
    </div>
  );
}
