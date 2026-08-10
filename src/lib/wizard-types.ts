export type ItemDraft = {
  localId: string;
  item_type: string;
  opening_type: string;
  location_in_house: string;
  width_mm: number;
  height_mm: number;
  quantity: number;
  system_series: string;
  glass_spec: string;
  finish: string;
  hardware: string;
  mesh: boolean;
  rate: number;
  remarks: string;
  photos: File[];
};

export function emptyItem(): ItemDraft {
  return {
    localId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    item_type: "window",
    opening_type: "sliding_2_track",
    location_in_house: "",
    width_mm: 1200,
    height_mm: 1200,
    quantity: 1,
    system_series: "Domal",
    glass_spec: "5mm_clear",
    finish: "powder_coated",
    hardware: "standard",
    mesh: false,
    rate: 0,
    remarks: "",
    photos: [],
  };
}

export function computeItemSqft(item: ItemDraft, minBillableSqft: number) {
  const unitSqft = (item.width_mm * item.height_mm) / 92903;
  const minimumApplied = unitSqft < minBillableSqft;
  const adjustedUnit = minimumApplied ? minBillableSqft : unitSqft;
  const sqft = Math.round(adjustedUnit * item.quantity * 100) / 100;
  return { sqft, minimumApplied };
}

export function computeItemAmount(item: ItemDraft, minBillableSqft: number) {
  const { sqft, minimumApplied } = computeItemSqft(item, minBillableSqft);
  return { sqft, minimumApplied, amount: Math.round(sqft * item.rate) };
}
