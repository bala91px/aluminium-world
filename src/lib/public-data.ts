import { supabase, isSupabaseConfigured } from "./supabase";

// Every function here calls a token-gated Postgres function (see
// supabase/schema.sql, "PUBLIC ACCESS" section) — never a raw table select.
// That's what keeps a curious customer from browsing other people's jobs
// with the anon key that ships in the browser bundle.

export type PublicQuote = {
  quote_no: string;
  status: string;
  subtotal: number;
  discount_type: "amount" | "percent" | null;
  discount_value: number;
  gst_pct: number;
  total: number;
  advance_pct: number;
  advance_amount: number;
  lead_time_days: number;
  terms: string | null;
  customer_name: string;
  site_label: string;
  business_name: string;
  business_phone: string | null;
  business_address: string | null;
};

export type PublicQuoteItem = {
  item_type: string;
  opening_type: string;
  location_in_house: string;
  width_mm: number;
  height_mm: number;
  quantity: number;
  sqft: number;
  glass_spec: string;
  finish: string;
  hardware: string;
  mesh: boolean;
  amount: number;
};

export async function getPublicQuote(token: string): Promise<PublicQuote | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("get_public_quote", { p_token: token });
  if (error || !data?.[0]) {
    if (error) console.error("getPublicQuote", error);
    return null;
  }
  return data[0] as PublicQuote;
}

export async function getPublicQuoteItems(token: string): Promise<PublicQuoteItem[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.rpc("get_public_quote_items", { p_token: token });
  if (error) {
    console.error("getPublicQuoteItems", error);
    return [];
  }
  return (data ?? []) as PublicQuoteItem[];
}

export async function acceptPublicQuote(token: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data, error } = await supabase.rpc("accept_public_quote", { p_token: token });
  if (error) {
    console.error("acceptPublicQuote", error);
    return false;
  }
  return Boolean(data);
}

export type PublicJob = {
  job_no: string;
  promised_date: string | null;
  customer_name: string;
  site_label: string;
  total: number;
  paid: number;
  business_phone: string | null;
};

export type PublicJobStage = {
  stage_key: string;
  sequence: number;
  status: string;
  blocked_reason: string | null;
  completed_at: string | null;
};

export async function getPublicJob(token: string): Promise<PublicJob | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("get_public_job", { p_token: token });
  if (error || !data?.[0]) {
    if (error) console.error("getPublicJob", error);
    return null;
  }
  return data[0] as PublicJob;
}

export async function getPublicJobStages(token: string): Promise<PublicJobStage[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.rpc("get_public_job_stages", { p_token: token });
  if (error) {
    console.error("getPublicJobStages", error);
    return [];
  }
  return (data ?? []) as PublicJobStage[];
}

export type PublicDelivery = {
  job_no: string;
  customer_name: string;
  customer_mobile: string;
  site_label: string;
  lat: number | null;
  lng: number | null;
  driver_name: string;
  delivered_at: string | null;
};

export async function getPublicDelivery(token: string): Promise<PublicDelivery | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("get_public_delivery", { p_token: token });
  if (error || !data?.[0]) {
    if (error) console.error("getPublicDelivery", error);
    return null;
  }
  return data[0] as PublicDelivery;
}

export type PublicDeliveryItem = { item_type: string; location_in_house: string; quantity: number };

export async function getPublicDeliveryItems(token: string): Promise<PublicDeliveryItem[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.rpc("get_public_delivery_items", { p_token: token });
  if (error) {
    console.error("getPublicDeliveryItems", error);
    return [];
  }
  return (data ?? []) as PublicDeliveryItem[];
}

export async function markDelivered(token: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data, error } = await supabase.rpc("mark_delivered", { p_token: token });
  if (error) {
    console.error("markDelivered", error);
    return false;
  }
  return Boolean(data);
}
