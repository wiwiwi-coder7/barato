import { BIRTHDAY_LOCK_NOTICE, BIRTHDAY_ROUTE, type BirthdayContentRecord } from "@/lib/birthday";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BirthdayLockedCard } from "../components/BirthdayLockedCard";
import { BirthdayPageContent } from "./BirthdayPage";

const birthdayContent: BirthdayContentRecord = {
  owner: "edi",
  catText: "تولدت مبارککک",
  cakeText: "بیا اینم کیک",
  motorText: "حال کن",
  catImageKey: "gray-party-cat_e5396e64.jpg",
  cakeImageKey: "birthday-cake_27009994.jpg",
  motorImageKey: "black-motorcycle_e1160508.jpg",
};

describe("birthday user experience", () => {
  it("renders the locked birthday card and exact ownership notice for ordinary users", () => {
    const markup = renderToStaticMarkup(<BirthdayLockedCard isDarkTheme={false} />);
    expect(markup).toContain("تبریک تولد");
    expect(markup).toContain("قفل‌شده");
    expect(markup).toContain(BIRTHDAY_LOCK_NOTICE);
  });

  it("renders Adin's dedicated birthday content", () => {
    vi.stubGlobal("location", new URL("https://example.test/birthday/edi"));
    const markup = renderToStaticMarkup(<BirthdayPageContent content={birthdayContent} />);
    expect(markup).toContain("تولدت مبارککک");
    expect(markup).toContain("gray-party-cat_e5396e64.jpg");
    vi.unstubAllGlobals();
  });

  it("wires the birthday page to the shared edi route while other birthday URLs have no route", () => {
    const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    expect(appSource).toContain('path={BIRTHDAY_ROUTE} component={BirthdayPage}');
    expect(BIRTHDAY_ROUTE).toBe("/birthday/edi");
  });

  it("exposes the fixed birthday route for direct testing from the admin editor", () => {
    const adminSource = readFileSync(resolve(process.cwd(), "client/src/pages/AdminPage.tsx"), "utf8");
    expect(adminSource).toContain("مشاهده و تست");
    expect(adminSource).toContain("کپی لینک تولد");
    expect(adminSource).toContain("birthdayPublicUrl()");
    expect(adminSource).toContain("window.open(birthdayPublicUrl()");
  });
});
