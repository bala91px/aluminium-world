"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select } from "./ui";
import { approveQuote, rejectQuote, recordAdvance } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import type { PaymentMode } from "@/lib/types";

export function ShareQuote({ token, mobile, quoteNo }: { token: string; mobile: string; quoteNo: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  if (typeof window !== "undefined" && !origin) setOrigin(window.location.origin);
  const url = `${origin}/q/${token}`;
  const message = `Aluminium World — your quote ${quoteNo} is ready. View and accept here: ${url}`;
  const waUrl = `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <a href={waUrl} target="_blank" rel="noopener noreferrer">
        <Button type="button" variant="secondary">Send on WhatsApp</Button>
      </a>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied ✓" : "Copy link"}
      </Button>
    </div>
  );
}

export function ApprovalButtons({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {!rejecting ? (
        <div className="flex gap-2">
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await approveQuote(quoteId);
              router.refresh();
              setBusy(false);
            }}
          >
            Approve
          </Button>
          <Button variant="danger" onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label>Reason (required, goes back to supervisor)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <Button
              variant="danger"
              disabled={busy || !reason.trim()}
              onClick={async () => {
                setBusy(true);
                await rejectQuote(quoteId, reason);
                router.refresh();
                setBusy(false);
              }}
            >
              Confirm reject
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RecordAdvance({ quoteId, advanceAmount }: { quoteId: string; advanceAmount: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(advanceAmount));
  const [mode, setMode] = useState<PaymentMode>("upi");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ jobId: string } | null>(null);

  if (done) {
    return (
      <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
        Advance recorded — job created.{" "}
        <a className="font-medium underline" href={`/jobs/${done.jobId}`}>
          Open job tracker →
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600">
        Record the advance to start the job. Expected: <strong>{formatMoney(advanceAmount)}</strong>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Amount received (₹)</Label>
          <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <Label>Mode</Label>
          <Select value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank transfer</option>
            <option value="cheque">Cheque</option>
          </Select>
        </div>
      </div>
      <Button
        disabled={busy || !Number(amount)}
        onClick={async () => {
          setBusy(true);
          const res = await recordAdvance(quoteId, Number(amount), mode);
          setDone({ jobId: res.jobId });
          router.refresh();
          setBusy(false);
        }}
      >
        {busy ? "Recording…" : "Record advance & create job"}
      </Button>
    </div>
  );
}
