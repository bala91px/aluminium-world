"use server";

import { revalidatePath } from "next/cache";
import { readDB, writeDB } from "./db";
import { requireUser, requireOwner } from "./session";
import { nowIso, randomToken } from "./format";
import { STAGE_TEMPLATE } from "./stages";
import type {
  BlockedReason,
  Customer,
  ItemType,
  OpeningType,
  GlassSpec,
  SystemSeries,
  Job,
  JobStage,
  PaymentMode,
  Quote,
  QuoteItem,
} from "./types";

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/approvals");
  revalidatePath("/quotes");
  revalidatePath("/jobs");
}

// ---------- Rate memory (§5.2) ----------

export type RateHint = { rate: number; label: string } | null;

export async function getRateHint(
  customerId: string,
  itemType: ItemType,
  openingType: OpeningType,
  systemSeries: SystemSeries,
  glassSpec: GlassSpec,
): Promise<RateHint> {
  const db = readDB();
  const matches = (e: (typeof db.rateHistory)[number]) =>
    e.itemType === itemType &&
    e.openingType === openingType &&
    e.systemSeries === systemSeries &&
    e.glassSpec === glassSpec;

  const own = db.rateHistory
    .filter((e) => e.customerId === customerId && matches(e))
    .sort((a, b) => (a.quotedAt < b.quotedAt ? 1 : -1))[0];
  if (own) {
    return {
      rate: own.rate,
      label: `Last quoted ₹${own.rate}/sqft — this customer`,
    };
  }

  const ninetyDaysAgo = Date.now() - 90 * 86400000;
  const recent = db.rateHistory
    .filter((e) => matches(e) && new Date(e.quotedAt).getTime() >= ninetyDaysAgo)
    .sort((a, b) => (a.quotedAt < b.quotedAt ? 1 : -1))[0];
  if (recent) {
    const d = new Date(recent.quotedAt);
    const dd = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      rate: recent.rate,
      label: `Last quoted ₹${recent.rate}/sqft — ${recent.customerName}, ${dd}`,
    };
  }

  return null;
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const db = readDB();
  const q = query.trim().toLowerCase();
  if (!q) return db.customers.slice(0, 8);
  return db.customers
    .filter((c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q))
    .slice(0, 8);
}

// ---------- Quote creation ----------

export type NewQuoteInput = {
  customerId?: string;
  newCustomer?: { name: string; mobile: string; address?: string };
  siteLabel: string;
  capturedAddress?: string;
  lat?: number;
  lng?: number;
  items: Array<{
    itemType: ItemType;
    openingType: OpeningType;
    locationInHouse: string;
    widthMm: number;
    heightMm: number;
    quantity: number;
    systemSeries: SystemSeries;
    glassSpec: GlassSpec;
    finish: string;
    hardware: string;
    mesh: boolean;
    rate: number;
    remarks?: string;
  }>;
  discountValue: number;
  advancePct: number;
  leadTimeDays: number;
  terms: string;
};

export async function createQuote(input: NewQuoteInput): Promise<{ quoteId: string; quoteNo: string }> {
  const user = await requireUser();
  const db = readDB();

  let customerId = input.customerId;
  if (!customerId && input.newCustomer) {
    const id = `c${db.customers.length + 1}-${Date.now()}`;
    db.customers.push({ id, ...input.newCustomer });
    customerId = id;
  }
  if (!customerId) throw new Error("Customer required");

  const siteId = `s${db.sites.length + 1}-${Date.now()}`;
  db.sites.push({
    id: siteId,
    customerId,
    label: input.siteLabel,
    capturedAddress: input.capturedAddress,
    lat: input.lat,
    lng: input.lng,
  });

  const minSqft = db.settings.minBillableSqft;
  const items: QuoteItem[] = input.items.map((it, i) => {
    const rawSqft = (it.widthMm * it.heightMm) / 92903;
    const minApplied = rawSqft < minSqft;
    const sqft = Math.round((minApplied ? minSqft : rawSqft) * it.quantity * 100) / 100;
    const amount = Math.round(sqft * it.rate);
    return { id: `it-${Date.now()}-${i}`, ...it, sqft, minApplied, amount };
  });

  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const afterDiscount = subtotal - input.discountValue;
  const gstPct = db.settings.defaultGstPct;
  const total = Math.round(afterDiscount * (1 + gstPct / 100));
  const advanceAmount = Math.round(total * (input.advancePct / 100));

  db.counters.quote += 1;
  const fy = "26-27";
  const quoteNo = `AW/Q/${fy}/${String(db.counters.quote).padStart(4, "0")}`;

  const needsApproval =
    db.settings.approvalMode === "always" ||
    (db.settings.approvalMode === "threshold" && total >= db.settings.thresholdAmount);

  const quote: Quote = {
    id: `q-${Date.now()}`,
    quoteNo,
    customerId,
    siteId,
    createdBy: user.id,
    status: needsApproval ? "pending_approval" : "approved",
    items,
    subtotal,
    discountValue: input.discountValue,
    gstPct,
    total,
    advancePct: input.advancePct,
    advanceAmount,
    leadTimeDays: input.leadTimeDays,
    terms: input.terms,
    publicToken: randomToken(),
    createdAt: nowIso(),
    ...(needsApproval
      ? {}
      : { approvedBy: "system", approvedAt: nowIso(), sentAt: nowIso() }),
  };

  db.quotes.push(quote);
  items.forEach((it) => {
    const cust = db.customers.find((c) => c.id === customerId)!;
    db.rateHistory.push({
      id: `rh-${quote.id}-${it.id}`,
      customerId: customerId!,
      itemType: it.itemType,
      openingType: it.openingType,
      systemSeries: it.systemSeries,
      glassSpec: it.glassSpec,
      rate: it.rate,
      customerName: cust.name,
      quotedAt: quote.createdAt,
    });
  });

  writeDB(db);
  revalidateAll();
  return { quoteId: quote.id, quoteNo };
}

// ---------- Approval (§5.3) ----------

export async function approveQuote(quoteId: string): Promise<void> {
  const owner = await requireOwner();
  const db = readDB();
  const quote = db.quotes.find((q) => q.id === quoteId);
  if (!quote) throw new Error("Quote not found");
  quote.status = "sent";
  quote.approvedBy = owner.id;
  quote.approvedAt = nowIso();
  quote.sentAt = nowIso();
  writeDB(db);
  revalidateAll();
}

export async function rejectQuote(quoteId: string, reason: string): Promise<void> {
  await requireOwner();
  const db = readDB();
  const quote = db.quotes.find((q) => q.id === quoteId);
  if (!quote) throw new Error("Quote not found");
  quote.status = "rejected";
  quote.rejectedReason = reason || "No reason given";
  writeDB(db);
  revalidateAll();
}

export async function updateSettings(patch: Partial<{
  approvalMode: "always" | "threshold" | "never";
  thresholdAmount: number;
  minBillableSqft: number;
  defaultAdvancePct: number;
}>): Promise<void> {
  await requireOwner();
  const db = readDB();
  db.settings = { ...db.settings, ...patch };
  writeDB(db);
  revalidateAll();
}

// ---------- Public: accept quote ----------

export async function acceptQuote(token: string): Promise<void> {
  const db = readDB();
  const quote = db.quotes.find((q) => q.publicToken === token);
  if (!quote) throw new Error("Not found");
  quote.status = "accepted";
  quote.acceptedAt = nowIso();
  writeDB(db);
  revalidateAll();
  revalidatePath(`/q/${token}`);
}

// ---------- Payment -> job creation (§5.5) ----------

export async function recordAdvance(
  quoteId: string,
  amount: number,
  mode: PaymentMode,
): Promise<{ jobId: string; publicToken: string }> {
  const user = await requireUser();
  const db = readDB();
  const quote = db.quotes.find((q) => q.id === quoteId);
  if (!quote) throw new Error("Quote not found");

  db.payments.push({
    id: `pay-${Date.now()}`,
    jobId: "",
    quoteId,
    type: "advance",
    amount,
    mode,
    receivedOn: nowIso(),
    recordedBy: user.id,
  });

  let job = db.jobs.find((j) => j.quoteId === quoteId);
  if (!job) {
    db.counters.job += 1;
    const stages: JobStage[] = STAGE_TEMPLATE.map((s, i) => ({
      key: s.key,
      label: s.label,
      sequence: i + 1,
      customerVisible: s.customerVisible,
      status: i === 0 ? "done" : "pending",
      ...(i === 0 ? { startedAt: nowIso(), completedAt: nowIso() } : {}),
      ...(i === 1 ? { status: "in_progress" as const, startedAt: nowIso() } : {}),
    }));
    job = {
      id: `job-${Date.now()}`,
      jobNo: `AW/J/26-27/${String(db.counters.job).padStart(4, "0")}`,
      quoteId,
      customerId: quote.customerId,
      siteId: quote.siteId,
      status: "active",
      promisedDate: new Date(Date.now() + quote.leadTimeDays * 86400000).toISOString(),
      publicToken: randomToken(),
      assignedSupervisor: quote.createdBy,
      createdAt: nowIso(),
      stages,
    };
    db.jobs.push(job);
  }
  db.payments[db.payments.length - 1].jobId = job.id;

  writeDB(db);
  revalidateAll();
  revalidatePath(`/q/${quote.publicToken}`);
  revalidatePath(`/track/${job.publicToken}`);
  return { jobId: job.id, publicToken: job.publicToken };
}

// ---------- Stage engine ----------

function findJob(db: ReturnType<typeof readDB>, jobId: string): Job {
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("Job not found");
  return job;
}

export async function advanceStage(jobId: string, stageKey: string): Promise<void> {
  await requireUser();
  const db = readDB();
  const job = findJob(db, jobId);
  const idx = job.stages.findIndex((s) => s.key === stageKey);
  if (idx === -1) return;
  job.stages[idx].status = "done";
  job.stages[idx].completedAt = nowIso();
  job.stages[idx].blockedReason = undefined;
  job.stages[idx].blockedNote = undefined;

  const next = job.stages[idx + 1];
  if (next) {
    next.status = "in_progress";
    next.startedAt = nowIso();
    job.status = "active";
  } else {
    job.status = "completed";
  }
  writeDB(db);
  revalidateAll();
  revalidatePath(`/track/${job.publicToken}`);
}

export async function blockStage(
  jobId: string,
  stageKey: string,
  reason: BlockedReason,
  note: string,
): Promise<void> {
  await requireUser();
  const db = readDB();
  const job = findJob(db, jobId);
  const stage = job.stages.find((s) => s.key === stageKey);
  if (!stage) return;
  stage.status = "blocked";
  stage.blockedReason = reason;
  stage.blockedNote = note;
  job.status = "blocked";
  writeDB(db);
  revalidateAll();
  revalidatePath(`/track/${job.publicToken}`);
}

export async function unblockStage(jobId: string, stageKey: string): Promise<void> {
  await requireUser();
  const db = readDB();
  const job = findJob(db, jobId);
  const stage = job.stages.find((s) => s.key === stageKey);
  if (!stage) return;
  stage.status = "in_progress";
  stage.blockedReason = undefined;
  stage.blockedNote = undefined;
  job.status = "active";
  writeDB(db);
  revalidateAll();
  revalidatePath(`/track/${job.publicToken}`);
}

export async function recordBalancePayment(
  jobId: string,
  amount: number,
  mode: PaymentMode,
): Promise<void> {
  const user = await requireUser();
  const db = readDB();
  const job = findJob(db, jobId);
  db.payments.push({
    id: `pay-${Date.now()}`,
    jobId,
    quoteId: job.quoteId,
    type: "balance",
    amount,
    mode,
    receivedOn: nowIso(),
    recordedBy: user.id,
  });
  writeDB(db);
  revalidateAll();
  revalidatePath(`/track/${job.publicToken}`);
}
