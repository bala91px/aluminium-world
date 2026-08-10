import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  BlockedReason,
  Customer,
  Delivery,
  Enquiry,
  EnquirySource,
  Job,
  JobStage,
  PaymentMode,
  Profile,
  Quote,
  QuoteItem,
  QuoteStatus,
  Settings,
  StageStatus,
  Vendor,
} from "./types";

// Every function here degrades gracefully to an empty/no-op result when
// Supabase isn't configured yet, so the UI stays browsable while Bala wires
// in the real project keys (see README-DEMO.md).

export function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  return supabase;
}

export async function getSettings(): Promise<Settings | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (error) {
    console.error("getSettings", error);
    return null;
  }
  return data as Settings;
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  if (!isSupabaseConfigured || !supabase || query.trim().length < 2) return [];
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .or(`name.ilike.%${query}%,mobile.ilike.%${query}%`)
    .limit(8);
  if (error) {
    console.error("searchCustomers", error);
    return [];
  }
  return data as Customer[];
}

export async function createCustomer(input: {
  name: string;
  mobile: string;
  address?: string;
}): Promise<Customer | null> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("customers").insert(input).select().single();
  if (error) {
    console.error("createCustomer", error);
    return null;
  }
  return data as Customer;
}

export async function createSite(input: {
  customer_id: string;
  label: string;
  lat?: number | null;
  lng?: number | null;
  captured_address?: string | null;
}) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("sites").insert(input).select().single();
  if (error) {
    console.error("createSite", error);
    return null;
  }
  return data;
}

export type RateHint = { rate: number; customerName: string; quotedAt: string };

export async function getRateHint(params: {
  itemType: string;
  openingType: string;
  systemSeries: string;
  glassSpec: string;
  customerId?: string;
}): Promise<RateHint | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  // Priority 1: last rate quoted to this same customer for the same combination.
  if (params.customerId) {
    const { data } = await supabase
      .from("rate_history")
      .select("rate, quoted_at, customers(name)")
      .eq("customer_id", params.customerId)
      .eq("item_type", params.itemType)
      .eq("opening_type", params.openingType)
      .eq("system_series", params.systemSeries)
      .eq("glass_spec", params.glassSpec)
      .order("quoted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      return toRateHint(data);
    }
  }

  // Priority 2: last rate quoted to anyone in the last 90 days.
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("rate_history")
    .select("rate, quoted_at, customers(name)")
    .eq("item_type", params.itemType)
    .eq("opening_type", params.openingType)
    .eq("system_series", params.systemSeries)
    .eq("glass_spec", params.glassSpec)
    .gte("quoted_at", since)
    .order("quoted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return toRateHint(data);

  return null;
}

function toRateHint(row: {
  rate: number;
  quoted_at: string;
  customers: { name: string } | { name: string }[] | null;
}): RateHint {
  const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
  return {
    rate: row.rate,
    quotedAt: row.quoted_at,
    customerName: customer?.name ?? "a customer",
  };
}

// ---- Profiles ----

export async function listSupervisors(): Promise<Profile[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "supervisor")
    .eq("active", true);
  if (error) {
    console.error("listSupervisors", error);
    return [];
  }
  return data as Profile[];
}

// ---- Enquiries ----

export async function listEnquiries(): Promise<Enquiry[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listEnquiries", error);
    return [];
  }
  return data as Enquiry[];
}

export async function createEnquiry(input: {
  customer_name: string;
  customer_mobile: string;
  source: EnquirySource;
  rough_need?: string;
  assigned_supervisor?: string | null;
  created_by: string;
}) {
  const sb = requireSupabase();
  const status = input.assigned_supervisor ? "assigned" : "new";
  const { data, error } = await sb
    .from("enquiries")
    .insert({ ...input, status })
    .select()
    .single();
  if (error) {
    console.error("createEnquiry", error);
    return null;
  }
  return data as Enquiry;
}

// ---- Quotes ----

export type NewQuoteItem = {
  item_type: string;
  opening_type: string;
  location_in_house: string;
  width_mm: number;
  height_mm: number;
  quantity: number;
  sqft: number;
  system_series: string;
  glass_spec: string;
  finish: string;
  finish_code?: string;
  hardware: string;
  hardware_brand?: string;
  mesh: boolean;
  rate: number;
  amount: number;
  remarks?: string;
  sort_order: number;
  photos?: File[];
};

export function decideApprovalStatus(
  settings: Settings | null,
  total: number,
  discountPct: number
): QuoteStatus {
  if (!settings || settings.approval_mode === "always") return "pending_approval";
  if (settings.approval_mode === "never") return "approved";
  // threshold
  if (total > settings.threshold_amount) return "pending_approval";
  if (discountPct > settings.discount_threshold_pct) return "pending_approval";
  return "approved";
}

export async function createQuoteWithItems(input: {
  customer_id: string;
  site_id: string;
  created_by: string;
  status: QuoteStatus;
  subtotal: number;
  discount_type: "amount" | "percent" | null;
  discount_value: number;
  gst_pct: number;
  total: number;
  advance_pct: number;
  advance_amount: number;
  lead_time_days: number;
  terms: string;
  items: NewQuoteItem[];
  enquiryId?: string;
}): Promise<Quote | null> {
  const sb = requireSupabase();

  const approvedFields =
    input.status === "approved"
      ? { approved_at: new Date().toISOString() }
      : {};

  const { data: quote, error } = await sb
    .from("quotes")
    .insert({
      customer_id: input.customer_id,
      site_id: input.site_id,
      created_by: input.created_by,
      status: input.status,
      subtotal: input.subtotal,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      gst_pct: input.gst_pct,
      total: input.total,
      advance_pct: input.advance_pct,
      advance_amount: input.advance_amount,
      lead_time_days: input.lead_time_days,
      terms: input.terms,
      ...approvedFields,
    })
    .select()
    .single();

  if (error || !quote) {
    console.error("createQuoteWithItems", error);
    return null;
  }

  const itemsPayload = input.items.map((item, i) => ({
    quote_id: quote.id,
    item_type: item.item_type,
    opening_type: item.opening_type,
    location_in_house: item.location_in_house,
    width_mm: item.width_mm,
    height_mm: item.height_mm,
    quantity: item.quantity,
    sqft: item.sqft,
    system_series: item.system_series,
    glass_spec: item.glass_spec,
    finish: item.finish,
    finish_code: item.finish_code ?? null,
    hardware: item.hardware,
    hardware_brand: item.hardware_brand ?? null,
    mesh: item.mesh,
    rate: item.rate,
    amount: item.amount,
    remarks: item.remarks ?? null,
    sort_order: i,
  }));

  const { data: insertedItems, error: itemsError } = await sb
    .from("quote_items")
    .insert(itemsPayload)
    .select();

  if (itemsError) {
    console.error("createQuoteWithItems items", itemsError);
  }

  if (insertedItems) {
    await uploadItemPhotos(insertedItems as QuoteItem[], input.items);
  }

  if (input.enquiryId) {
    await sb
      .from("enquiries")
      .update({ status: "converted", converted_quote_id: quote.id })
      .eq("id", input.enquiryId);
  }

  return quote as Quote;
}

async function uploadItemPhotos(inserted: QuoteItem[], source: NewQuoteItem[]) {
  if (!supabase) return;
  for (let i = 0; i < inserted.length; i++) {
    const photos = source[i]?.photos;
    if (!photos || photos.length === 0) continue;
    for (const file of photos) {
      try {
        const path = `${inserted[i].id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("quote-photos")
          .upload(path, file);
        if (uploadError) throw uploadError;
        await supabase
          .from("quote_item_photos")
          .insert({ quote_item_id: inserted[i].id, storage_path: path });
      } catch (err) {
        // Photo upload is best-effort for the demo — a missing storage
        // bucket shouldn't block the quote itself from being created.
        console.error("uploadItemPhotos", err);
      }
    }
  }
}

export async function updateSettings(patch: Partial<Settings>) {
  const sb = requireSupabase();
  const { error } = await sb.from("settings").update(patch).eq("id", 1);
  if (error) console.error("updateSettings", error);
  return !error;
}

export async function listQuotes(): Promise<
  (Quote & { customers: { name: string } | null; sites: { label: string } | null })[]
> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("quotes")
    .select("*, customers(name), sites(label)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listQuotes", error);
    return [];
  }
  return data as unknown as (Quote & {
    customers: { name: string } | null;
    sites: { label: string } | null;
  })[];
}

export type QuoteDetail = Quote & {
  customers: { name: string; mobile: string } | null;
  sites: { label: string; captured_address: string | null } | null;
  quote_items: QuoteItem[];
};

export async function getQuoteDetail(id: string): Promise<QuoteDetail | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from("quotes")
    .select("*, customers(name, mobile), sites(label, captured_address), quote_items(*)")
    .eq("id", id)
    .single();
  if (error) {
    console.error("getQuoteDetail", error);
    return null;
  }
  return data as unknown as QuoteDetail;
}

export async function listPendingApprovals(): Promise<
  (Quote & { customers: { name: string } | null })[]
> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("quotes")
    .select("*, customers(name)")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listPendingApprovals", error);
    return [];
  }
  return data as unknown as (Quote & { customers: { name: string } | null })[];
}

export async function approveQuote(id: string, approvedBy: string) {
  const sb = requireSupabase();
  const { error } = await sb
    .from("quotes")
    .update({ status: "approved", approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("approveQuote", error);
  return !error;
}

export async function rejectQuote(id: string, reason: string) {
  const sb = requireSupabase();
  const { error } = await sb
    .from("quotes")
    .update({ status: "rejected", rejected_reason: reason })
    .eq("id", id);
  if (error) console.error("rejectQuote", error);
  return !error;
}

export async function markQuoteSent(id: string) {
  const sb = requireSupabase();
  const { error } = await sb
    .from("quotes")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("markQuoteSent", error);
  return !error;
}

// ---- Jobs, stages, payments ----

export async function recordAdvanceAndCreateJob(input: {
  quote: QuoteDetail;
  amount: number;
  mode: PaymentMode;
  reference?: string;
  recordedBy: string;
}): Promise<Job | null> {
  const sb = requireSupabase();
  const { quote } = input;

  const promisedDate = new Date();
  promisedDate.setDate(promisedDate.getDate() + quote.lead_time_days);

  const { data: job, error: jobError } = await sb
    .from("jobs")
    .insert({
      quote_id: quote.id,
      customer_id: quote.customer_id,
      site_id: quote.site_id,
      assigned_supervisor: quote.created_by,
      promised_date: promisedDate.toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (jobError || !job) {
    console.error("recordAdvanceAndCreateJob job", jobError);
    return null;
  }

  const { error: stagesError } = await sb.rpc("create_default_job_stages", {
    p_job_id: job.id,
  });
  if (stagesError) console.error("create_default_job_stages", stagesError);

  const { error: paymentError } = await sb.from("payments").insert({
    job_id: job.id,
    quote_id: quote.id,
    type: "advance",
    amount: input.amount,
    mode: input.mode,
    reference: input.reference || null,
    recorded_by: input.recordedBy,
  });
  if (paymentError) console.error("recordAdvanceAndCreateJob payment", paymentError);

  await sb
    .from("job_stages")
    .update({ status: "done", completed_at: new Date().toISOString(), updated_by: input.recordedBy })
    .eq("job_id", job.id)
    .eq("stage_key", "advance_received");

  return job as Job;
}

export type JobDetail = Job & {
  customers: { name: string; mobile: string } | null;
  sites: { label: string; captured_address: string | null } | null;
  quotes: { quote_no: string; total: number; advance_amount: number } | null;
  job_stages: JobStage[];
  payments: { amount: number; type: string }[];
  deliveries: Delivery[];
};

export async function listJobs(): Promise<
  (Job & { customers: { name: string } | null; job_stages: { status: StageStatus }[] })[]
> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("jobs")
    .select("*, customers(name), job_stages(status)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listJobs", error);
    return [];
  }
  return data as unknown as (Job & {
    customers: { name: string } | null;
    job_stages: { status: StageStatus }[];
  })[];
}

export async function getJobDetail(id: string): Promise<JobDetail | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "*, customers(name, mobile), sites(label, captured_address), quotes(quote_no, total, advance_amount), job_stages(*), payments(amount, type), deliveries(*)"
    )
    .eq("id", id)
    .single();
  if (error) {
    console.error("getJobDetail", error);
    return null;
  }
  const detail = data as unknown as JobDetail;
  detail.job_stages.sort((a, b) => a.sequence - b.sequence);
  return detail;
}

export async function updateJobStage(
  stageId: string,
  patch: {
    status: StageStatus;
    blocked_reason?: BlockedReason | null;
    blocked_note?: string | null;
    notes?: string | null;
    updated_by: string;
  }
): Promise<boolean> {
  const sb = requireSupabase();
  const timestamps: Record<string, string | null> = {};
  if (patch.status === "in_progress") timestamps.started_at = new Date().toISOString();
  if (patch.status === "done") timestamps.completed_at = new Date().toISOString();
  if (patch.status !== "blocked") {
    timestamps.blocked_reason = null;
    timestamps.blocked_note = null;
  }
  const { error } = await sb
    .from("job_stages")
    .update({ ...patch, ...timestamps })
    .eq("id", stageId);
  if (error) console.error("updateJobStage", error);
  return !error;
}

export async function recordPayment(input: {
  jobId: string;
  quoteId: string;
  type: "milestone" | "balance";
  amount: number;
  mode: PaymentMode;
  reference?: string;
  recordedBy: string;
}): Promise<boolean> {
  const sb = requireSupabase();
  const { error } = await sb.from("payments").insert({
    job_id: input.jobId,
    quote_id: input.quoteId,
    type: input.type,
    amount: input.amount,
    mode: input.mode,
    reference: input.reference || null,
    recorded_by: input.recordedBy,
  });
  if (error) console.error("recordPayment", error);
  return !error;
}

export async function dispatchDelivery(input: {
  jobId: string;
  driverName: string;
  driverMobile: string;
}): Promise<Delivery | null> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("deliveries")
    .insert({
      job_id: input.jobId,
      driver_name: input.driverName,
      driver_mobile: input.driverMobile,
      dispatched_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    console.error("dispatchDelivery", error);
    return null;
  }
  await sb
    .from("job_stages")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("job_id", input.jobId)
    .eq("stage_key", "out_for_delivery");
  return data as Delivery;
}

// ---- Vendors ----

export async function searchVendors(query: string): Promise<Vendor[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let req = supabase.from("vendors").select("*").order("company");
  if (query.trim()) {
    req = req.textSearch("search", query.trim().split(/\s+/).join(" & "));
  }
  const { data, error } = await req.limit(50);
  if (error) {
    console.error("searchVendors", error);
    return [];
  }
  return data as Vendor[];
}
