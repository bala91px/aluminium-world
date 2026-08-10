import type { GlassSpec, ItemType, OpeningType, SystemSeries } from "./types";

export const ITEM_TYPES: ItemType[] = [
  "Window",
  "Door",
  "Partition",
  "Glass railing",
  "Shower cubicle",
  "Mosquito mesh",
  "Other",
];

export const OPENING_TYPES: OpeningType[] = [
  "Sliding (2 track)",
  "Sliding (3 track)",
  "Openable/casement",
  "Fixed",
  "Top hung",
  "Sliding-folding",
];

export const SYSTEM_SERIES: SystemSeries[] = ["Domal", "Jindal", "Hindalco", "Local"];

export const GLASS_SPECS: GlassSpec[] = [
  "5mm clear",
  "5mm tinted",
  "6mm toughened",
  "8mm toughened",
  "Frosted",
  "DGU",
];

export const FINISH_OPTIONS = ["Powder coated", "Anodized", "Wooden finish", "Mill finish"];
export const HARDWARE_OPTIONS = ["Standard", "Premium"];
