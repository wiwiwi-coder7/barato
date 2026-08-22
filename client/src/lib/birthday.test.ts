import { describe, expect, it } from "vitest";
import { ADIN_BIRTHDAY_TITLE, BIRTHDAY_LOCK_NOTICE, BIRTHDAY_OWNER, BIRTHDAY_ROUTE, BIRTHDAY_STAGE_ORDER, getBirthdayAccess, nextBirthdayStage } from "./birthday";

describe("birthday access", () => {
  it("opens the initial birthday destination only for the edi owner identifier", () => {
    expect(getBirthdayAccess(BIRTHDAY_OWNER).unlocked).toBe(true);
    expect(BIRTHDAY_ROUTE).toBe("/birthday/edi");
  });

  it("keeps the birthday section locked for ordinary identifiers", () => {
    expect(getBirthdayAccess("ordinary-user").unlocked).toBe(false);
    expect(getBirthdayAccess(undefined).unlocked).toBe(false);
  });

  it("keeps the temporary owner notice and Adin birthday title exact", () => {
    expect(getBirthdayAccess("ordinary-user").notice).toBe("این بخش تا پایان ماه فقط متعلق به کاربر edi است.");
    expect(BIRTHDAY_LOCK_NOTICE).toContain("تا پایان ماه");
    expect(ADIN_BIRTHDAY_TITLE).toBe("تولدت مبارک آدین");
  });

  it("keeps the supplied asset sequence fixed from cat to cake to motorcycle", () => {
    expect(BIRTHDAY_STAGE_ORDER).toEqual(["cat", "cake", "motor"]);
    expect(nextBirthdayStage("cat")).toBe("cake");
    expect(nextBirthdayStage("cake")).toBe("motor");
  });
});
