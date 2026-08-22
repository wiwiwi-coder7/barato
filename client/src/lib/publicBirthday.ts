export type GiftExperience = "gift" | "birthday";

export type BirthdayCakePreset = {
  id: number;
  slug: string;
  label: string;
  imageKey: string;
  hasBuiltinCandles: boolean;
  sortOrder: number;
  isActive?: boolean;
};

export type BirthdayPublicSettings = {
  isEnabled: boolean;
  candlePrompt: string;
  backgroundColor: string;
  updatedAt?: string;
};

export const DEFAULT_BIRTHDAY_PUBLIC_SETTINGS: BirthdayPublicSettings = {
  isEnabled: true,
  candlePrompt: "آرزو کن و شمع را فوت کن",
  backgroundColor: "#8D1F85",
};

export function candleDigitsForAge(age: number) {
  if (!Number.isInteger(age) || age < 0 || age > 99) return [];
  return String(age).split("");
}

export function shouldRenderNumberCandles(hasBuiltinCandles: boolean) {
  return !hasBuiltinCandles;
}

export function isValidBirthdayAge(age: number | null | undefined) {
  return Number.isInteger(age) && Number(age) >= 0 && Number(age) <= 99;
}

export function isBirthdayPrompt(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 120;
}

export function isBirthdayBackgroundColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value);
}
