import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { PublicBirthdayGift } from "./PublicBirthdayGift";

describe("PublicBirthdayGift", () => {
  it("shows only the standalone candle and concise blow instruction before the birthday surprise is triggered", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <PublicBirthdayGift
          gift={{
            id: 1,
            name: "آزمون",
            message: "دوستت دارم",
            personalMessage: null,
            imageKey: null,
            color: "#8758ef",
            theme: "light",
            token: "test",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: null,
            experience: "birthday",
            birthdayAge: 17,
            birthdayCakeKey: "test-cake.jpg",
            birthdayHasBuiltinCandles: false,
          }}
        />
      </QueryClientProvider>,
    );

    expect(markup).toContain("آرزو کن و شمع را فوت کن");
    expect(markup).toContain("خاموش کردن با فوت");
    expect(markup).not.toContain("در حال گوش");
    expect(markup).not.toContain("test-cake.jpg");
    expect(markup).not.toContain("تولدت مبارک آزمون");
  });
});
