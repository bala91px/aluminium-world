export const ITEM_TYPES = [
  { value: "window", label: "Window" },
  { value: "door", label: "Door" },
  { value: "partition", label: "Partition" },
  { value: "glass_railing", label: "Glass railing" },
  { value: "shower_cubicle", label: "Shower cubicle" },
  { value: "mosquito_mesh", label: "Mosquito mesh" },
  { value: "other", label: "Other" },
];

export const OPENING_TYPES = [
  { value: "sliding_2_track", label: "Sliding (2 track)" },
  { value: "sliding_3_track", label: "Sliding (3 track)" },
  { value: "openable", label: "Openable / casement" },
  { value: "fixed", label: "Fixed" },
  { value: "top_hung", label: "Top hung" },
  { value: "sliding_folding", label: "Sliding-folding" },
];

export const SYSTEM_SERIES = ["Domal", "Jindal", "Hindalco", "Local"];

export const GLASS_SPECS = [
  { value: "5mm_clear", label: "5mm clear" },
  { value: "5mm_tinted", label: "5mm tinted" },
  { value: "6mm_toughened", label: "6mm toughened" },
  { value: "8mm_toughened", label: "8mm toughened" },
  { value: "frosted", label: "Frosted" },
  { value: "dgu", label: "DGU" },
];

export const FINISHES = [
  { value: "powder_coated", label: "Powder coated" },
  { value: "anodized", label: "Anodized" },
  { value: "wooden_finish", label: "Wooden finish" },
  { value: "mill_finish", label: "Mill finish" },
];

export const HARDWARE = [
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
];

export function labelFor(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}
