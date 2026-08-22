export type GiftTheme = "light" | "dark";
export const PERSONAL_MESSAGE_MAX_LENGTH = 1000;

export type GiftRecord = {
  id: number;
  name: string;
  message: string;
  personalMessage: string | null;
  imageKey: string | null;
  color: string;
  theme: GiftTheme;
  token: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  expiresAt: Date | string | null;
  experience?: "gift" | "birthday";
  birthdayAge?: number | null;
  birthdayCakeKey?: string | null;
  birthdayHasBuiltinCandles?: boolean;
};

const publicStorageBase = `${String(import.meta.env.VITE_SUPABASE_URL || "https://qqafgmkxqzjpppczzrac.supabase.co").replace(/\/$/, "")}/storage/v1/object/public/gift-media`;

export function publicStorageUrl(key: string) {
  return `${publicStorageBase}/${key}`;
}

export function giftPath(token: string, basePath = import.meta.env.BASE_URL) {
  return `${basePath}#/gift/${token}`;
}

export function giftUrl(token: string) {
  return `${window.location.origin}${giftPath(token)}`;
}

export function giftDisplayText(name: string, locale: "fa" | "en" | "ar" = "fa") {
  const message = locale === "ar" ? "أحبك" : locale === "en" ? "I love you" : "دوستت دارم";
  return `${name} ${message}`;
}

export function giftImageUrl(imageKey: string | null | undefined) {
  return imageKey ? publicStorageUrl(imageKey) : null;
}

export const MUSIC_CLIP_URL = publicStorageUrl("love-you-confirmed-138-158_92f6bd58.mp3");
