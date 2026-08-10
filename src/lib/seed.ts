import type {
  DB,
  Customer,
  Site,
  Quote,
  QuoteItem,
  Job,
  JobStage,
  Payment,
  RateHistoryEntry,
} from "./types";
import { STAGE_TEMPLATE } from "./stages";

const DAY = 86400000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const ahead = (days: number) => new Date(Date.now() + days * DAY).toISOString();

let tokenSeed = 1;
function token(): string {
  tokenSeed += 1;
  return `demo${tokenSeed}${Math.random().toString(36).slice(2, 10)}`.padEnd(32, "0").slice(0, 32);
}

function item(
  partial: Partial<QuoteItem> & Pick<QuoteItem, "itemType" | "openingType" | "locationInHouse" | "widthMm" | "heightMm" | "systemSeries" | "glassSpec" | "finish" | "hardware" | "rate">,
  id: string,
): QuoteItem {
  const quantity = partial.quantity ?? 1;
  const rawSqft = (partial.widthMm * partial.heightMm) / 92903;
  const minApplied = rawSqft < 10;
  const sqft = Math.round((minApplied ? 10 : rawSqft) * quantity * 100) / 100;
  const amount = Math.round(sqft * partial.rate);
  return {
    id,
    mesh: false,
    ...partial,
    quantity,
    sqft,
    minApplied,
    amount,
  };
}

function quoteTotals(items: QuoteItem[], advancePct: number, discountValue = 0) {
  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const afterDiscount = subtotal - discountValue;
  const gstPct = 18;
  const total = Math.round(afterDiscount * (1 + gstPct / 100));
  const advanceAmount = Math.round(total * (advancePct / 100));
  return { subtotal, gstPct, total, advanceAmount };
}

function stagesUpTo(activeIndex: number, blockedAt?: { index: number; reason: JobStage["blockedReason"]; note: string }): JobStage[] {
  return STAGE_TEMPLATE.map((s, i) => {
    const base: JobStage = {
      key: s.key,
      label: s.label,
      sequence: i + 1,
      customerVisible: s.customerVisible,
      status: "pending",
    };
    if (blockedAt && i === blockedAt.index) {
      return {
        ...base,
        status: "blocked",
        blockedReason: blockedAt.reason,
        blockedNote: blockedAt.note,
        startedAt: ago(6),
      };
    }
    if (i < activeIndex) {
      return { ...base, status: "done", startedAt: ago(10 - i), completedAt: ago(9 - i) };
    }
    if (i === activeIndex && !blockedAt) {
      return { ...base, status: "in_progress", startedAt: ago(2) };
    }
    return base;
  });
}

export function buildSeed(): DB {
  const owner = { id: "u-arif", name: "Arif", role: "owner" as const, phone: "9645012345" };
  const sup1 = { id: "u-shafeeq", name: "Shafeeq", role: "supervisor" as const, phone: "9645012346" };
  const sup2 = { id: "u-jaseem", name: "Jaseem", role: "supervisor" as const, phone: "9645012347" };

  const customerDefs: [string, string, string][] = [
    ["Rasheed K.", "9744010001", "Kalpetta"],
    ["Sabu Mathew", "9744010002", "Meppadi"],
    ["Anitha Joseph", "9744010003", "Sultan Bathery"],
    ["Faisal Kalladi", "9744010004", "Mananthavady"],
    ["Sreekumar M.", "9744010005", "Panamaram"],
    ["Rajesh Menon", "9744010006", "Kalpetta"],
    ["Shahina Beevi", "9744010007", "Meppadi"],
    ["Vinod P.K.", "9744010008", "Sultan Bathery"],
    ["Ummer Farooq", "9744010009", "Mananthavady"],
    ["Beena Thomas", "9744010010", "Panamaram"],
    ["Noushad C.", "9744010011", "Kalpetta"],
    ["Preetha Nair", "9744010012", "Meppadi"],
  ];

  const customers: Customer[] = customerDefs.map(([name, mobile, place], i) => ({
    id: `c${i + 1}`,
    name,
    mobile,
    address: `${place}, Wayanad`,
  }));

  const sites: Site[] = customers.map((c, i) => ({
    id: `s${i + 1}`,
    customerId: c.id,
    label: `${c.name.split(" ")[0]} house, ${c.address?.split(",")[0]}`,
    capturedAddress: c.address,
  }));

  const quotes: Quote[] = [];
  const jobs: Job[] = [];
  const payments: Payment[] = [];
  const rateHistory: RateHistoryEntry[] = [];

  function addRateHistory(q: Quote, cust: Customer) {
    q.items.forEach((it) => {
      rateHistory.push({
        id: `rh-${q.id}-${it.id}`,
        customerId: cust.id,
        itemType: it.itemType,
        openingType: it.openingType,
        systemSeries: it.systemSeries,
        glassSpec: it.glassSpec,
        rate: it.rate,
        customerName: cust.name,
        quotedAt: q.createdAt,
      });
    });
  }

  // Quote 1 & 2: pending approval
  for (let i = 0; i < 2; i++) {
    const cust = customers[i];
    const items = [
      item({ itemType: "Window", openingType: "Sliding (2 track)", locationInHouse: "Bedroom 1", widthMm: 1500, heightMm: 1200, systemSeries: "Domal", glassSpec: "5mm clear", finish: "Powder coated (white)", hardware: "Standard", rate: 620, quantity: 2 }, `q${i + 1}-i1`),
      item({ itemType: "Door", openingType: "Sliding-folding", locationInHouse: "Living room", widthMm: 2400, heightMm: 2100, systemSeries: "Jindal", glassSpec: "8mm toughened", finish: "Anodized", hardware: "Premium", rate: 780, quantity: 1 }, `q${i + 1}-i2`),
    ];
    const t = quoteTotals(items, 50);
    const q: Quote = {
      id: `q${i + 1}`,
      quoteNo: `AW/Q/26-27/000${i + 1}`,
      customerId: cust.id,
      siteId: sites[i].id,
      createdBy: i % 2 === 0 ? sup1.id : sup2.id,
      status: "pending_approval",
      items,
      subtotal: t.subtotal,
      discountValue: 0,
      gstPct: t.gstPct,
      total: t.total,
      advancePct: 50,
      advanceAmount: t.advanceAmount,
      leadTimeDays: 18,
      terms: "50% advance, balance on delivery.",
      publicToken: token(),
      createdAt: ago(1),
    };
    quotes.push(q);
    addRateHistory(q, cust);
  }

  // Quote 3,4,5: approved & sent
  for (let i = 2; i < 5; i++) {
    const cust = customers[i];
    const items = [
      item({ itemType: "Window", openingType: "Openable/casement", locationInHouse: "Kitchen", widthMm: 900, heightMm: 1100, systemSeries: "Local", glassSpec: "5mm tinted", finish: "Mill finish", hardware: "Standard", rate: 540, quantity: 3 }, `q${i + 1}-i1`),
    ];
    const t = quoteTotals(items, 50);
    const q: Quote = {
      id: `q${i + 1}`,
      quoteNo: `AW/Q/26-27/000${i + 1}`,
      customerId: cust.id,
      siteId: sites[i].id,
      createdBy: sup1.id,
      status: "sent",
      items,
      subtotal: t.subtotal,
      discountValue: 0,
      gstPct: t.gstPct,
      total: t.total,
      advancePct: 50,
      advanceAmount: t.advanceAmount,
      leadTimeDays: 15,
      terms: "50% advance, balance on delivery.",
      approvedBy: owner.id,
      approvedAt: ago(4),
      sentAt: ago(4),
      publicToken: token(),
      createdAt: ago(5),
    };
    quotes.push(q);
    addRateHistory(q, cust);
  }

  // Quote 6,7: accepted -> become jobs
  const acceptedDefs = [
    { idx: 5, blocked: { index: 6, reason: "awaiting_payment" as const, note: "Balance ₹42,000 not received since advance stages closed." }, promised: ahead(-2) },
    { idx: 6, blocked: { index: 1, reason: "material_unavailable" as const, note: "8mm toughened glass sheet delayed from Kozhikode vendor." }, promised: ahead(9) },
  ];
  acceptedDefs.forEach(({ idx, blocked, promised }, n) => {
    const cust = customers[idx];
    const items = [
      item({ itemType: "Door", openingType: "Sliding (3 track)", locationInHouse: "Living room", widthMm: 2700, heightMm: 2100, systemSeries: "Jindal", glassSpec: "8mm toughened", finish: "Powder coated (bronze)", hardware: "Premium — Dorma", rate: 810, quantity: 1 }, `q${6 + n}-i1`),
      item({ itemType: "Window", openingType: "Sliding (2 track)", locationInHouse: "Bedroom 2", widthMm: 1400, heightMm: 1200, systemSeries: "Jindal", glassSpec: "5mm tinted", finish: "Powder coated (bronze)", hardware: "Standard", rate: 640, quantity: 2 }, `q${6 + n}-i2`),
    ];
    const t = quoteTotals(items, 50);
    const q: Quote = {
      id: `q${6 + n}`,
      quoteNo: `AW/Q/26-27/000${6 + n}`,
      customerId: cust.id,
      siteId: sites[idx].id,
      createdBy: n === 0 ? sup1.id : sup2.id,
      status: "accepted",
      items,
      subtotal: t.subtotal,
      discountValue: 0,
      gstPct: t.gstPct,
      total: t.total,
      advancePct: 50,
      advanceAmount: t.advanceAmount,
      leadTimeDays: 20,
      terms: "50% advance, balance on delivery.",
      approvedBy: owner.id,
      approvedAt: ago(12),
      sentAt: ago(12),
      acceptedAt: ago(11),
      publicToken: token(),
      createdAt: ago(13),
    };
    quotes.push(q);
    addRateHistory(q, cust);

    payments.push({
      id: `pay-adv-${q.id}`,
      jobId: `j${n + 1}`,
      quoteId: q.id,
      type: "advance",
      amount: t.advanceAmount,
      mode: "upi",
      receivedOn: ago(11),
      recordedBy: q.createdBy,
    });

    const job: Job = {
      id: `j${n + 1}`,
      jobNo: `AW/J/26-27/000${n + 1}`,
      quoteId: q.id,
      customerId: cust.id,
      siteId: sites[idx].id,
      status: "blocked",
      promisedDate: promised,
      publicToken: token(),
      assignedSupervisor: q.createdBy,
      createdAt: ago(11),
      stages: stagesUpTo(blocked.index, { index: blocked.index, reason: blocked.reason, note: blocked.note }),
    };
    jobs.push(job);
  });

  // Quote 8: rejected
  {
    const cust = customers[7];
    const items = [
      item({ itemType: "Partition", openingType: "Fixed", locationInHouse: "Office", widthMm: 3000, heightMm: 2400, systemSeries: "Local", glassSpec: "Frosted", finish: "Mill finish", hardware: "Standard", rate: 480, quantity: 1 }, "q8-i1"),
    ];
    const t = quoteTotals(items, 50);
    const q: Quote = {
      id: "q8",
      quoteNo: "AW/Q/26-27/0008",
      customerId: cust.id,
      siteId: sites[7].id,
      createdBy: sup2.id,
      status: "rejected",
      items,
      subtotal: t.subtotal,
      discountValue: 0,
      gstPct: t.gstPct,
      total: t.total,
      advancePct: 50,
      advanceAmount: t.advanceAmount,
      leadTimeDays: 10,
      terms: "50% advance, balance on delivery.",
      rejectedReason: "Rate below rate-card floor — needs owner-set pricing first.",
      publicToken: token(),
      createdAt: ago(7),
    };
    quotes.push(q);
    addRateHistory(q, cust);
  }

  // 4 more live jobs (not tied to a listed quote, standalone historical jobs) at different stages, none blocked
  const extraJobDefs = [
    { customerIdx: 8, activeIndex: 2, promised: ahead(6) },
    { customerIdx: 9, activeIndex: 4, promised: ahead(10) },
    { customerIdx: 10, activeIndex: 8, promised: ahead(3) },
    { customerIdx: 11, activeIndex: 11, promised: ago(1) },
  ];
  extraJobDefs.forEach(({ customerIdx, activeIndex, promised }, n) => {
    const cust = customers[customerIdx];
    const jn = n + 3;
    const items = [
      item({ itemType: "Window", openingType: "Sliding (2 track)", locationInHouse: "Hall", widthMm: 1800, heightMm: 1300, systemSeries: "Domal", glassSpec: "6mm toughened", finish: "Powder coated (grey)", hardware: "Standard", rate: 660, quantity: 2 }, `qx${jn}-i1`),
    ];
    const t = quoteTotals(items, 50);
    const q: Quote = {
      id: `qx${jn}`,
      quoteNo: `AW/Q/26-27/010${jn}`,
      customerId: cust.id,
      siteId: sites[customerIdx].id,
      createdBy: n % 2 === 0 ? sup1.id : sup2.id,
      status: "accepted",
      items,
      subtotal: t.subtotal,
      discountValue: 0,
      gstPct: t.gstPct,
      total: t.total,
      advancePct: 50,
      advanceAmount: t.advanceAmount,
      leadTimeDays: 15,
      terms: "50% advance, balance on delivery.",
      approvedBy: owner.id,
      approvedAt: ago(20 - n),
      sentAt: ago(20 - n),
      acceptedAt: ago(19 - n),
      publicToken: token(),
      createdAt: ago(21 - n),
    };
    quotes.push(q);
    addRateHistory(q, cust);

    payments.push({
      id: `pay-adv-j${jn}`,
      jobId: `j${jn}`,
      quoteId: q.id,
      type: "advance",
      amount: t.advanceAmount,
      mode: "cash",
      receivedOn: ago(19 - n),
      recordedBy: q.createdBy,
    });

    const completed = activeIndex >= STAGE_TEMPLATE.length - 1;
    const job: Job = {
      id: `j${jn}`,
      jobNo: `AW/J/26-27/000${jn}`,
      quoteId: q.id,
      customerId: cust.id,
      siteId: sites[customerIdx].id,
      status: completed ? "completed" : "active",
      promisedDate: promised,
      publicToken: token(),
      assignedSupervisor: q.createdBy,
      createdAt: ago(19 - n),
      stages: completed
        ? STAGE_TEMPLATE.map((s, i) => ({
            key: s.key,
            label: s.label,
            sequence: i + 1,
            customerVisible: s.customerVisible,
            status: "done" as const,
            startedAt: ago(15 - i),
            completedAt: ago(14 - i),
          }))
        : stagesUpTo(activeIndex),
    };
    jobs.push(job);
  });

  return {
    users: [owner, sup1, sup2],
    customers,
    sites,
    quotes,
    jobs,
    payments,
    rateHistory,
    settings: {
      approvalMode: "always",
      thresholdAmount: 100000,
      discountThresholdPct: 10,
      minBillableSqft: 10,
      defaultGstPct: 18,
      defaultAdvancePct: 50,
      businessName: "Aluminium World",
      phone: "9645012345",
    },
    counters: { quote: 108, job: 6 },
  };
}
