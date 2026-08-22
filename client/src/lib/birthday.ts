import { publicStorageUrl } from "./gift";

export const BIRTHDAY_OWNER = "edi";
export const BIRTHDAY_ROUTE = `/birthday/${BIRTHDAY_OWNER}`;
export const BIRTHDAY_LOCK_NOTICE = "این بخش تا پایان ماه فقط متعلق به کاربر edi است.";
export const ADIN_BIRTHDAY_TITLE = "تولدت مبارک آدین";
export const BIRTHDAY_CAKE_SOUND_URL = publicStorageUrl("cake-cross-sound_a017a625.mp3");
export const BIRTHDAY_MOTOR_SOUND_URL = publicStorageUrl("motor-engine-sound_0438932e.mp3");

export type BirthdayContentRecord = {
  owner: string;
  catText: string;
  cakeText: string;
  motorText: string;
  catImageKey: string | null;
  cakeImageKey: string | null;
  motorImageKey: string | null;
};

export type BirthdayStage = "cat" | "cake" | "motor";
export const BIRTHDAY_STAGE_ORDER: BirthdayStage[] = ["cat", "cake", "motor"];

export function nextBirthdayStage(stage: BirthdayStage): BirthdayStage {
  return stage === "cat" ? "cake" : "motor";
}

export function birthdayImageUrl(imageKey: string | null | undefined) {
  return imageKey ? publicStorageUrl(imageKey) : null;
}

export function getBirthdayAccess(owner: string | null | undefined) {
  return {
    unlocked: owner === BIRTHDAY_OWNER,
    notice: BIRTHDAY_LOCK_NOTICE,
  };
}
