"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { t } from "@/lib/strings";
import {
  getPublicDelivery,
  getPublicDeliveryItems,
  markDelivered,
  type PublicDelivery,
  type PublicDeliveryItem,
} from "@/lib/public-data";
import { ITEM_TYPES, labelFor } from "@/lib/options";

function DeliveryView() {
  const token = useSearchParams().get("token");
  const [delivery, setDelivery] = useState<PublicDelivery | null>(null);
  const [items, setItems] = useState<PublicDeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([getPublicDelivery(token), getPublicDeliveryItems(token)]).then(([d, i]) => {
      setDelivery(d);
      setItems(i);
      setDone(Boolean(d?.delivered_at));
      setLoading(false);
    });
  }, [token]);

  async function handleMarkDelivered() {
    if (!token) return;
    setBusy(true);
    const ok = await markDelivered(token);
    setBusy(false);
    if (ok) setDone(true);
  }

  if (loading) return <Centered>{t.common.loading}</Centered>;
  if (!delivery) return <Centered>{t.common.error}</Centered>;

  const mapsUrl =
    delivery.lat && delivery.lng
      ? `https://www.google.com/maps?q=${delivery.lat},${delivery.lng}`
      : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 py-8">
      <div className="text-center">
        <p className="text-lg font-semibold">{delivery.job_no}</p>
        <p className="text-sm text-muted">{delivery.driver_name}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium">{delivery.customer_name}</p>
        <p className="text-muted">{delivery.customer_mobile}</p>
        <p className="mt-1 text-muted">{delivery.site_label}</p>
      </div>

      {items.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between border-b border-border py-1.5 last:border-0">
              <span className="text-muted">{item.location_in_house}</span>
              <span>
                {labelFor(ITEM_TYPES, item.item_type)} × {item.quantity}
              </span>
            </div>
          ))}
        </div>
      )}

      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-border py-3 text-center text-sm font-medium"
        >
          Open in Google Maps
        </a>
      )}

      {done ? (
        <p className="rounded-lg bg-status-done-bg p-4 text-center font-medium text-status-done">
          {t.delivery.delivered}
        </p>
      ) : (
        <button
          onClick={handleMarkDelivered}
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground disabled:opacity-50"
        >
          {busy ? t.common.loading : t.delivery.markDelivered}
        </button>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted">{children}</div>;
}

export default function DeliveryPage() {
  return (
    <Suspense fallback={null}>
      <DeliveryView />
    </Suspense>
  );
}
