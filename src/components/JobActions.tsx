"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select } from "./ui";
import { recordBalancePayment } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import type { PaymentMode } from "@/lib/types";

export function ShareTracker({ token, mobile, jobNo }: { token: string; mobile: string; jobNo: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  if (typeof window !== "undefined" && !origin) setOrigin(window.location.origin);
  const url = `${origin}/track/${token}`;
  const message = `Aluminium World — track your job ${jobNo} here: ${url}`;
  const waUrl = `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <a href={waUrl} target="_blank" rel="noopener noreferrer">
        <Button type="button" variant="secondary">Send tracker on WhatsApp</Button>
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

export function RecordBalance({
  jobId,
  balanceDue,
}: {
  jobId: string;
  balanceDue: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(balanceDue));
  const [mode, setMode] = useState<PaymentMode>("upi");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (balanceDue <= 0) {
    return <p className="text-sm text-emerald-700">Fully paid.</p>;
  }
  if (done) {
    return <p className="text-sm text-emerald-700">Payment recorded.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600">Balance due: <strong>{formatMoney(balanceDue)}</strong></p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Amount (₹)</Label>
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
          await recordBalancePayment(jobId, Number(amount), mode);
          setDone(true);
          router.refresh();
          setBusy(false);
        }}
      >
        {busy ? "Recording…" : "Record payment"}
      </Button>
    </div>
  );
}
