export type Role = "owner" | "supervisor" | "workshop";

export type Profile = {
  id: string;
  name: string;
  phone: string;
  role: Role;
  active: boolean;
};

export type EnquiryStatus = "new" | "assigned" | "site_visit_scheduled" | "converted";
export type EnquirySource = "phone_call" | "walk_in" | "referral" | "whatsapp" | "other";

export type Enquiry = {
  id: string;
  customer_name: string;
  customer_mobile: string;
  source: EnquirySource;
  rough_need: string | null;
  assigned_supervisor: string | null;
  status: EnquiryStatus;
  converted_quote_id: string | null;
  created_by: string;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  mobile: string;
  alt_mobile: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

export type Site = {
  id: string;
  customer_id: string;
  label: string;
  lat: number | null;
  lng: number | null;
  captured_address: string | null;
};

export type QuoteStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "sent"
  | "accepted";

export type Quote = {
  id: string;
  quote_no: string;
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
  terms: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  public_token: string;
  created_at: string;
};

export type ItemType =
  | "window"
  | "door"
  | "partition"
  | "glass_railing"
  | "shower_cubicle"
  | "mosquito_mesh"
  | "other";

export type OpeningType =
  | "sliding_2_track"
  | "sliding_3_track"
  | "openable"
  | "fixed"
  | "top_hung"
  | "sliding_folding";

export type GlassSpec =
  | "5mm_clear"
  | "5mm_tinted"
  | "6mm_toughened"
  | "8mm_toughened"
  | "frosted"
  | "dgu";

export type Finish = "powder_coated" | "anodized" | "wooden_finish" | "mill_finish";
export type Hardware = "standard" | "premium";

export type QuoteItem = {
  id: string;
  quote_id: string;
  item_type: ItemType;
  opening_type: OpeningType;
  location_in_house: string;
  width_mm: number;
  height_mm: number;
  quantity: number;
  sqft: number;
  system_series: string;
  glass_spec: GlassSpec;
  finish: Finish;
  finish_code: string | null;
  hardware: Hardware;
  hardware_brand: string | null;
  mesh: boolean;
  rate: number;
  amount: number;
  remarks: string | null;
  sort_order: number;
};

export type JobStatus = "active" | "completed" | "cancelled";

export type Job = {
  id: string;
  job_no: string;
  quote_id: string;
  customer_id: string;
  site_id: string;
  status: JobStatus;
  promised_date: string | null;
  actual_delivery_date: string | null;
  public_token: string;
  assigned_supervisor: string | null;
  created_at: string;
};

export type StageKey =
  | "advance_received"
  | "material_procurement"
  | "cutting"
  | "fitting"
  | "powder_coating"
  | "glazing"
  | "quality_check"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "installed"
  | "closed";

export type StageStatus = "pending" | "in_progress" | "done" | "blocked";

export type BlockedReason =
  | "awaiting_payment"
  | "material_unavailable"
  | "vendor_delay"
  | "labour_shortage"
  | "customer_hold"
  | "site_not_ready"
  | "other";

export type JobStage = {
  id: string;
  job_id: string;
  stage_key: StageKey;
  sequence: number;
  status: StageStatus;
  blocked_reason: BlockedReason | null;
  blocked_note: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_by: string | null;
  notes: string | null;
  customer_visible: boolean;
};

export type PaymentType = "advance" | "milestone" | "balance";
export type PaymentMode = "cash" | "upi" | "bank" | "cheque";

export type Payment = {
  id: string;
  job_id: string;
  quote_id: string;
  type: PaymentType;
  amount: number;
  mode: PaymentMode;
  reference: string | null;
  received_on: string;
  recorded_by: string;
  notes: string | null;
};

export type Delivery = {
  id: string;
  job_id: string;
  driver_name: string;
  driver_mobile: string;
  public_token: string;
  dispatched_at: string | null;
  delivered_at: string | null;
  pod_photo_path: string | null;
  notes: string | null;
};

export type Vendor = {
  id: string;
  company: string;
  contact_person: string | null;
  mobile: string;
  alt_mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  categories: string[];
  products: string | null;
  price_notes: string | null;
  met_at: string | null;
  met_on: string | null;
  card_photo_path: string | null;
  rating: number | null;
  notes: string | null;
};

export type ApprovalMode = "always" | "threshold" | "never";

export type Settings = {
  id: number;
  approval_mode: ApprovalMode;
  threshold_amount: number;
  discount_threshold_pct: number;
  notify_owner_always: boolean;
  min_billable_sqft: number;
  default_gst_pct: number;
  default_advance_pct: number;
  business_name: string;
  gstin: string | null;
  address: string | null;
  phone: string | null;
  logo_path: string | null;
};
