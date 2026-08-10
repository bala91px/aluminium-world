"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { QrCode } from "@/components/QrCode";
import { t } from "@/lib/strings";
import { formatINR, formatDateDDMMYYYY } from "@/lib/format";
import { dispatchDelivery, getJobDetail, recordPayment, updateJobStage, type JobDetail } from "@/lib/data";
import { BLOCKED_REASONS } from "@/lib/options";
import { publicUrl } from "@/lib/site-url";
import { waLink } from "@/lib/whatsapp";
import type { BlockedReason, JobStage, StageStatus } from "@/lib/types";

function JobView() {
  const { profile } = useSession();
  const id = useSearchParams().get("id");
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyStage, setBusyStage] = useState<string | null>(null);
  const [blockingStage, setBlockingStage] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState<BlockedReason>("material_unavailable");
  const [blockNote, setBlockNote] = useState("");

  const [showDispatch, setShowDispatch] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");

  const [showPayment, setShowPayment] = useState<"milestone" | "balance" | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  async function refresh() {
    if (!id) return;
    setJob(await getJobDetail(id));
  }

  useEffect(() => {
    if (!id) return;
    getJobDetail(id).then((j) => {
      setJob(j);
      setLoading(false);
    });
  }, [id]);

  if (!profile) return null;

  async function setStageStatus(stage: JobStage, status: StageStatus) {
    if (!profile) return;
    setBusyStage(stage.id);
    await updateJobStage(stage.id, { status, updated_by: profile.id });
    await refresh();
    setBusyStage(null);
  }

  async function confirmBlock() {
    if (!blockingStage || !profile) return;
    setBusyStage(blockingStage);
    await updateJobStage(blockingStage, {
      status: "blocked",
      blocked_reason: blockReason,
      blocked_note: blockNote,
      updated_by: profile.id,
    });
    await refresh();
    setBusyStage(null);
    setBlockingStage(null);
    setBlockNote("");
  }

  async function handleDispatch() {
    if (!job) return;
    setBusyStage("dispatch");
    const delivery = await dispatchDelivery({ jobId: job.id, driverName, driverMobile });
    setBusyStage(null);
    if (!delivery) return;
    await refresh();
    setShowDispatch(false);
    const url = publicUrl("/delivery", delivery.public_token);
    const message = `Delivery for ${job.job_no} — ${job.customers?.name}, ${job.sites?.label}. Details: ${url}`;
    window.open(waLink(driverMobile, message), "_blank");
  }

  async function handlePayment() {
    if (!job || !profile || !showPayment) return;
    setBusyStage("payment");
    await recordPayment({
      jobId: job.id,
      quoteId: job.quote_id,
      type: showPayment,
      amount: paymentAmount,
      mode: "upi",
      recordedBy: profile.id,
    });
    await refresh();
    setBusyStage(null);
    setShowPayment(null);
    setPaymentAmount(0);
  }

  if (loading || !job) {
    return (
      <AppShell profile={profile}>
        <p className="text-sm text-muted">{t.common.loading}</p>
      </AppShell>
    );
  }

  const paid = job.payments.reduce((s, p) => s + p.amount, 0);
  const balance = (job.quotes?.total ?? 0) - paid;
  const delivery = job.deliveries[0];

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold">{job.job_no}</h1>
            <p className="text-sm text-muted">
              {job.customers?.name} · {job.sites?.label}
            </p>
            {job.promised_date && (
              <p className="text-xs text-muted">
                {t.tracker.promisedDelivery}: {formatDateDDMMYYYY(job.promised_date)}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <QrCode value={publicUrl("/track", job.public_token)} size={72} />
          </div>
        </div>

        <div className="mb-4 flex justify-between rounded-lg bg-status-pending-bg p-3 text-sm">
          <span>
            {t.tracker.paid}: <strong>{formatINR(paid)}</strong>
          </span>
          <span>
            {t.tracker.balance}: <strong>{formatINR(balance)}</strong>
          </span>
        </div>

        {balance > 0 && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => {
                setShowPayment("milestone");
                setPaymentAmount(0);
              }}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-medium"
            >
              {t.payments.recordMilestone}
            </button>
            <button
              onClick={() => {
                setShowPayment("balance");
                setPaymentAmount(balance);
              }}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-medium"
            >
              {t.payments.recordBalance}
            </button>
          </div>
        )}

        {showPayment && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">{t.payments.amount}</span>
              <input
                type="number"
                className="input"
                value={paymentAmount || ""}
                onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
              />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowPayment(null)} className="rounded-lg border border-border px-4 py-2 text-sm">
                {t.common.cancel}
              </button>
              <button
                onClick={handlePayment}
                disabled={busyStage === "payment" || paymentAmount <= 0}
                className="flex-1 rounded-lg bg-status-done px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {t.payments.confirm}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {job.job_stages.map((stage) => (
            <div key={stage.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t.jobStages[stage.stage_key]}</p>
                <StatusPill status={stage.status} label={statusLabel(stage.status)} />
              </div>

              {stage.status === "blocked" && (
                <p className="mt-1 text-xs text-status-blocked">
                  {stage.blocked_reason && t.blockedReasons[stage.blocked_reason]}
                  {stage.blocked_note ? ` — ${stage.blocked_note}` : ""}
                </p>
              )}

              {stage.stage_key === "out_for_delivery" && stage.status !== "done" ? (
                delivery ? (
                  <p className="mt-2 text-xs text-muted">
                    {t.delivery.dispatch}: {delivery.driver_name} ({delivery.driver_mobile})
                  </p>
                ) : showDispatch ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <input
                      className="input"
                      placeholder={t.delivery.driverName}
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder={t.delivery.driverMobile}
                      value={driverMobile}
                      onChange={(e) => setDriverMobile(e.target.value.replace(/\D/g, ""))}
                    />
                    <button
                      onClick={handleDispatch}
                      disabled={busyStage === "dispatch" || !driverName || driverMobile.length !== 10}
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
                    >
                      {t.delivery.sendToDriver}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDispatch(true)}
                    className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                  >
                    {t.delivery.dispatch}
                  </button>
                )
              ) : blockingStage === stage.id ? (
                <div className="mt-2 flex flex-col gap-2">
                  <select
                    className="input"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value as BlockedReason)}
                  >
                    {BLOCKED_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    placeholder="Note"
                    value={blockNote}
                    onChange={(e) => setBlockNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setBlockingStage(null)} className="rounded-lg border border-border px-3 py-2 text-xs">
                      {t.common.cancel}
                    </button>
                    <button
                      onClick={confirmBlock}
                      className="flex-1 rounded-lg bg-status-blocked px-3 py-2 text-xs font-medium text-white"
                    >
                      {t.dashboard.blocked}
                    </button>
                  </div>
                </div>
              ) : (
                stage.status !== "done" && (
                  <div className="mt-2 flex gap-2">
                    {stage.status === "pending" && (
                      <button
                        onClick={() => setStageStatus(stage, "in_progress")}
                        disabled={busyStage === stage.id}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                      >
                        Start
                      </button>
                    )}
                    {(stage.status === "in_progress" || stage.status === "blocked") && (
                      <button
                        onClick={() => setStageStatus(stage, "done")}
                        disabled={busyStage === stage.id}
                        className="rounded-lg bg-status-done px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Mark done
                      </button>
                    )}
                    {stage.status !== "blocked" && (
                      <button
                        onClick={() => setBlockingStage(stage.id)}
                        className="rounded-lg border border-status-blocked px-3 py-1.5 text-xs font-medium text-status-blocked"
                      >
                        Block
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function statusLabel(status: StageStatus): string {
  return {
    pending: t.dashboard.pending,
    in_progress: "In progress",
    done: "Done",
    blocked: t.dashboard.blocked,
  }[status];
}

export default function JobViewPage() {
  return (
    <Suspense fallback={null}>
      <JobView />
    </Suspense>
  );
}
