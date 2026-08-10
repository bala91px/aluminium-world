"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select } from "./ui";
import { updateSettings } from "@/lib/actions";
import type { ApprovalMode, Settings } from "@/lib/types";

export default function SettingsPanel({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [mode, setMode] = useState<ApprovalMode>(settings.approvalMode);
  const [threshold, setThreshold] = useState(String(settings.thresholdAmount));
  const [busy, setBusy] = useState(false);

  return (
    <Card className="p-4">
      <h2 className="mb-1 text-sm font-semibold text-zinc-900">Approval setting</h2>
      <p className="mb-3 text-xs text-zinc-500">
        Every quote wait for you, only big ones, or none — you decide.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Mode</Label>
          <Select value={mode} onChange={(e) => setMode(e.target.value as ApprovalMode)}>
            <option value="always">Always — every quote waits</option>
            <option value="threshold">Threshold — only above amount</option>
            <option value="never">Never — auto-approve, notify only</option>
          </Select>
        </div>
        {mode === "threshold" && (
          <div>
            <Label>Threshold (₹)</Label>
            <Input inputMode="numeric" value={threshold} onChange={(e) => setThreshold(e.target.value.replace(/\D/g, ""))} />
          </div>
        )}
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await updateSettings({ approvalMode: mode, thresholdAmount: Number(threshold) || 0 });
            router.refresh();
            setBusy(false);
          }}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}
