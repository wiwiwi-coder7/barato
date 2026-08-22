import type { GiftTheme } from "./gift";
import type { GiftExperience } from "./publicBirthday";

export type FastGiftFields = {
  name: string;
  personalMessage: string | null;
  color: string;
  theme: GiftTheme;
  expiresAt: Date | null;
  experience?: GiftExperience;
  birthdayAge?: number | null;
  birthdayCakeKey?: string | null;
  birthdayHasBuiltinCandles?: boolean;
};

export function createTextGiftPayload(fields: FastGiftFields) {
  return {
    ...fields,
    message: "دوستت دارم",
    imageKey: null,
  };
}
