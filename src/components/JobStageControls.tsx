"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Label, Select, Textarea } from "./ui";
import { advanceStage, blockStage, unblockStage } from "@/lib/actions";
import { BLOCKED_REASON_LABEL, type BlockedReason, type JobStage } from "@/lib/types";

export default function JobStageControls({ jobId, stages }: { jobId: string; stages: JobStage[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reason, setReason] = useState<BlockedReason>("material_unavailable");
  const [note, setNote] = useState("");

  const current = stages.find((s) => s.status === "in_progress" || s.status === "blocked");
  if (!current) {
    return <p className="text-sm text-zinc-500">All stages complete.</p>;
  }

  if (current.status === "blocked") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-medium text-red-800">
          {current.label} is blocked: {BLOCKED_REASON_LABEL[current.blockedReason ?? "other"]}
        </p>
        {current.blockedNote && <p className="mt-1 text-sm text-red-700">{current.blockedNote}</p>}
        <Button
          className="mt-3"
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await unblockStage(jobId, current.key);
            router.refresh();
            setBusy(false);
          }}
        >
          Resolved — resume
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600">
        Current stage: <span className="font-semibold text-zinc-900">{current.label}</span>
      </p>
      {!blocking ? (
        <div className="flex gap-2">
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await advanceStage(jobId, current.key);
              router.refresh();
              setBusy(false);
            }}
          >
            Mark done → next stage
          </Button>
          <Button variant="danger" onClick={() => setBlocking(true)}>
            Mark blocked
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3">
          <Label>Reason</Label>
          <Select value={reason} onChange={(e) => setReason(e.target.value as BlockedReason)}>
            {Object.entries(BLOCKED_REASON_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Label>Note</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await blockStage(jobId, current.key, reason, note);
                router.refresh();
                setBusy(false);
              }}
            >
              Confirm blocked
            </Button>
            <Button variant="ghost" onClick={() => setBlocking(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
