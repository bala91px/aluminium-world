"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/strings";
import { DEMO_PROFILES, demoSignIn, isDemoMode } from "@/lib/demo-auth";

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function handleTap(name: string, role: "owner" | "supervisor") {
    setBusy(name);
    const profile = await demoSignIn(name, role);
    setBusy(null);
    if (!profile) return;
    router.replace(profile.role === "owner" ? "/dashboard" : "/jobs");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold">{t.appName}</p>
          <h1 className="mt-2 text-xl font-semibold">{t.login.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.login.subtitle}</p>
          {isDemoMode() && (
            <span className="mt-3 inline-block rounded-full bg-status-progress-bg px-3 py-1 text-xs font-medium text-status-progress">
              {t.login.demoTag}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {DEMO_PROFILES.map((p) => (
            <button
              key={p.name}
              disabled={busy !== null}
              onClick={() => handleTap(p.name, p.role)}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 text-left shadow-sm transition hover:border-accent disabled:opacity-50"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-sm text-muted">
                {busy === p.name ? t.common.loading : t.roles[p.role]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
