import { describe, expect, it } from "vitest";
import { LOCALE_META, translateText } from "./locale";

describe("Barato locale catalog", () => {
  it("translates shared interface copy across Persian, English, and Arabic", () => {
    expect(translateText("دوستت دارم", "fa")).toBe("دوستت دارم");
    expect(translateText("دوستت دارم", "en")).toBe("I love you");
    expect(translateText("دوستت دارم", "ar")).toBe("أحبك");
    expect(translateText("پنل مدیریت", "en")).toBe("Admin panel");
    expect(translateText("Go Home", "fa")).toBe("بازگشت به خانه");
  });

  it("keeps directionality correct for the supported languages", () => {
    expect(LOCALE_META.fa.dir).toBe("rtl");
    expect(LOCALE_META.ar.dir).toBe("rtl");
    expect(LOCALE_META.en.dir).toBe("ltr");
  });
});
