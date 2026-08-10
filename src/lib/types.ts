export type Role = "owner" | "supervisor";

export type User = {
  id: string;
  name: string;
  role: Role;
  phone: string;
};

export type Customer = {
  id: string;
  name: string;
  mobile: string;
  address?: string;
};

export type Site = {
  id: string;
  customerId: string;
  label: string;
  capturedAddress?: string;
  lat?: number;
  lng?: number;
};

export type ItemType =
  | "Window"
  | "Door"
  | "Partition"
  | "Glass railing"
  | "Shower cubicle"
  | "Mosquito mesh"
  | "Other";

export type OpeningType =
  | "Sliding (2 track)"
  | "Sliding (3 track)"
  | "Openable/casement"
  | "Fixed"
  | "Top hung"
  | "Sliding-folding";

export type GlassSpec =
  | "5mm clear"
  | "5mm tinted"
  | "6mm toughened"
  | "8mm toughened"
  | "Frosted"
  | "DGU";

export type SystemSeries = "Domal" | "Jindal" | "Hindalco" | "Local";

export type QuoteItem = {
  id: string;
  itemType: ItemType;
  openingType: OpeningType;
  locationInHouse: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  sqft: number;
  minApplied: boolean;
  systemSeries: SystemSeries;
  glassSpec: GlassSpec;
  finish: string;
  hardware: string;
  mesh: boolean;
  rate: number;
  amount: number;
  remarks?: string;
};

export type QuoteStatus =
  | "pending_approval"
  | "approved"
  | "sent"
  | "accepted"
  | "rejected";

export type Quote = {
  id: string;
  quoteNo: string;
  customerId: string;
  siteId: string;
  createdBy: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  discountValue: number;
  gstPct: number;
  total: number;
  advancePct: number;
  advanceAmount: number;
  leadTimeDays: number;
  terms: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  sentAt?: string;
  acceptedAt?: string;
  publicToken: string;
  createdAt: string;
};

export type BlockedReason =
  | "awaiting_payment"
  | "material_unavailable"
  | "vendor_delay"
  | "labour_shortage"
  | "customer_hold"
  | "site_not_ready"
  | "other";

export const BLOCKED_REASON_LABEL: Record<BlockedReason, string> = {
  awaiting_payment: "Awaiting payment",
  material_unavailable: "Material unavailable",
  vendor_delay: "Vendor delay",
  labour_shortage: "Labour shortage",
  customer_hold: "Customer hold",
  site_not_ready: "Site not ready",
  other: "Other",
};

export type StageStatus = "pending" | "in_progress" | "done" | "blocked";

export type StageKey =
  | "advance_received"
  | "procurement"
  | "cutting"
  | "fitting"
  | "coating"
  | "glazing"
  | "quality_check"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "installed"
  | "closed";

export type JobStage = {
  key: StageKey;
  label: string;
  sequence: number;
  customerVisible: boolean;
  status: StageStatus;
  blockedReason?: BlockedReason;
  blockedNote?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
};

export type JobStatus = "active" | "blocked" | "completed";

export type Job = {
  id: string;
  jobNo: string;
  quoteId: string;
  customerId: string;
  siteId: string;
  status: JobStatus;
  promisedDate: string;
  publicToken: string;
  assignedSupervisor: string;
  createdAt: string;
  stages: JobStage[];
};

export type PaymentType = "advance" | "milestone" | "balance";
export type PaymentMode = "cash" | "upi" | "bank" | "cheque";

export type Payment = {
  id: string;
  jobId: string;
  quoteId: string;
  type: PaymentType;
  amount: number;
  mode: PaymentMode;
  receivedOn: string;
  recordedBy: string;
  notes?: string;
};

export type ApprovalMode = "always" | "threshold" | "never";

export type Settings = {
  approvalMode: ApprovalMode;
  thresholdAmount: number;
  discountThresholdPct: number;
  minBillableSqft: number;
  defaultGstPct: number;
  defaultAdvancePct: number;
  businessName: string;
  phone: string;
};

export type RateHistoryEntry = {
  id: string;
  customerId: string;
  itemType: ItemType;
  openingType: OpeningType;
  systemSeries: SystemSeries;
  glassSpec: GlassSpec;
  rate: number;
  customerName: string;
  quotedAt: string;
};

export type DB = {
  users: User[];
  customers: Customer[];
  sites: Site[];
  quotes: Quote[];
  jobs: Job[];
  payments: Payment[];
  rateHistory: RateHistoryEntry[];
  settings: Settings;
  counters: { quote: number; job: number };
};
