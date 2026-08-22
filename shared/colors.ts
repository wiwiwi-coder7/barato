export const GIFT_COLORS = ["#E8538A", "#9560FF", "#587AFF"] as const;

export const GIFT_COLOR_META = [
  { value: "#E8538A", label: "صورتی" },
  { value: "#9560FF", label: "بنفش" },
  { value: "#587AFF", label: "آبی" },
] as const;

export const DEFAULT_GIFT_COLOR = GIFT_COLORS[0];

export function isApprovedGiftColor(color: string): color is (typeof GIFT_COLORS)[number] {
  return (GIFT_COLORS as readonly string[]).includes(color.toUpperCase());
}
