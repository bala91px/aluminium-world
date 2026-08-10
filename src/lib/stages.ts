import type { StageKey } from "./types";

export const STAGE_TEMPLATE: {
  key: StageKey;
  label: string;
  customerVisible: boolean;
}[] = [
  { key: "advance_received", label: "Advance received", customerVisible: true },
  { key: "procurement", label: "Material procurement", customerVisible: true },
  { key: "cutting", label: "Cutting", customerVisible: true },
  { key: "fitting", label: "Fitting / assembly", customerVisible: true },
  { key: "coating", label: "Powder coating", customerVisible: true },
  { key: "glazing", label: "Glazing", customerVisible: true },
  { key: "quality_check", label: "Quality check", customerVisible: false },
  { key: "ready_for_delivery", label: "Ready for delivery", customerVisible: true },
  { key: "out_for_delivery", label: "Out for delivery", customerVisible: true },
  { key: "delivered", label: "Delivered", customerVisible: true },
  { key: "installed", label: "Installed", customerVisible: true },
  { key: "closed", label: "Balance settled / closed", customerVisible: true },
];
