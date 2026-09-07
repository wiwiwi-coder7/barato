import { describe, expect, it } from "vitest";
import { LOCALE_META, translateText } from "./locale";

describe("Barato locale catalog", () => {
  it("translates shared interface copy across Persian, English, and Arabic", () => {
    expect(translateText("دوستت دارم", "fa")).toBe("دوستت دارم");
    expect(translateText("دوستت دارم", "en")).toBe("I love you");
    expect(translateText("دوستت دارم", "ar")).toBe("أحبك");
    expect(translateText("I LOVE YOU", "fa")).toBe("I LOVE YOU");
    expect(translateText("I LOVE YOU", "en")).toBe("I LOVE YOU");
    expect(translateText("I LOVE YOU", "ar")).toBe("I LOVE YOU");
    expect(translateText("پنل مدیریت", "en")).toBe("Admin panel");
    expect(translateText("مثلاً نرگس", "en")).toBe("For example, Audrey");
    expect(translateText("مثلاً نرگس", "ar")).toBe("مثلاً رقية");
    expect(translateText("اگر تصویر اضافه کنید، تعیین تاریخ انقضا الزامی است.", "en")).toBe("If you add an image, you must set an expiration date.");
    expect(translateText("اگر تصویر اضافه کنید، تعیین تاریخ انقضا الزامی است.", "ar")).toBe("إذا أضفت صورة، يجب تحديد تاريخ انتهاء الصلاحية.");
    expect(translateText("Go Home", "fa")).toBe("بازگشت به خانه");
  });

  it("keeps directionality correct for the supported languages", () => {
    expect(LOCALE_META.fa.dir).toBe("rtl");
    expect(LOCALE_META.ar.dir).toBe("rtl");
    expect(LOCALE_META.en.dir).toBe("ltr");
  });
});
