"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";
import { acceptQuote } from "@/lib/actions";

export default function AcceptQuote({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);

  if (accepted) {
    return (
      <div className="rounded-xl bg-emerald-50 p-5 text-center">
        <p className="text-lg font-semibold text-emerald-800">Quote accepted ✓</p>
        <p className="mt-1 text-sm text-emerald-700">
          Our team will be in touch to collect the advance and start your job.
        </p>
      </div>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await acceptQuote(token);
        setAccepted(true);
        router.refresh();
        setBusy(false);
      }}
    >
      {busy ? "Accepting…" : "Accept this quote"}
    </Button>
  );
}
