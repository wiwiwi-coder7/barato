// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BirthdayContentRecord } from "@/lib/birthday";
import { BirthdayPageContent } from "./BirthdayPage";

const content: BirthdayContentRecord = {
  owner: "edi",
  catText: "تولدت مبارککک",
  cakeText: "بیا اینم کیک",
  motorText: "حال کن",
  catImageKey: "gray-party-cat_e5396e64.jpg",
  cakeImageKey: "birthday-cake_27009994.jpg",
  motorImageKey: "black-motorcycle_e1160508.jpg",
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("interactive Adin birthday page", () => {
  it("moves from gray cat to cake, shows the X, then reveals the motorcycle finale", async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    render(<BirthdayPageContent content={content} />);

    expect(screen.getByText("تولدت مبارککک")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "رفتن به کیک تولد" }));
    expect(screen.getByText("بیا اینم کیک")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "کلیک روی کیک تولد" }));
    expect(screen.getByTestId("cake-cross-overlay")).toBeTruthy();

    await act(async () => { vi.advanceTimersByTime(1100); });
    expect(screen.getByText("حال کن")).toBeTruthy();
  });

  it("plays engine audio only while the motorcycle is held and resets it on release", async () => {
    vi.useFakeTimers();
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    render(<BirthdayPageContent content={content} />);

    fireEvent.click(screen.getByRole("button", { name: "رفتن به کیک تولد" }));
    fireEvent.click(screen.getByRole("button", { name: "کلیک روی کیک تولد" }));
    await act(async () => { vi.advanceTimersByTime(1100); });

    const motor = screen.getByRole("button", { name: "برای پخش صدای موتور نگه دارید" });
    fireEvent.pointerDown(motor, { pointerId: 1 });
    await act(async () => undefined);
    expect(play).toHaveBeenCalled();
    expect(screen.getByText("در حال پخش…")).toBeTruthy();

    fireEvent.pointerUp(motor, { pointerId: 1 });
    expect(pause).toHaveBeenCalled();
    expect(screen.getByText("نگه دار")).toBeTruthy();
    const audio = document.querySelector('audio[src*="motor-engine-sound"]') as HTMLAudioElement;
    expect(audio.currentTime).toBe(0);
  });

  it("stops engine audio for pointer cancellation and browser focus loss", async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    render(<BirthdayPageContent content={content} />);

    fireEvent.click(screen.getByRole("button", { name: "رفتن به کیک تولد" }));
    fireEvent.click(screen.getByRole("button", { name: "کلیک روی کیک تولد" }));
    await act(async () => { vi.advanceTimersByTime(1100); });
    const motor = screen.getByRole("button", { name: "برای پخش صدای موتور نگه دارید" });

    fireEvent.pointerDown(motor, { pointerId: 2 });
    fireEvent.pointerCancel(motor, { pointerId: 2 });
    expect(pause).toHaveBeenCalled();

    fireEvent.pointerDown(motor, { pointerId: 3 });
    window.dispatchEvent(new Event("blur"));
    expect(pause).toHaveBeenCalledTimes(2);
  });

  it("prevents drag and long-press context actions without blocking motor playback", async () => {
    vi.useFakeTimers();
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    render(<BirthdayPageContent content={content} />);

    fireEvent.click(screen.getByRole("button", { name: "رفتن به کیک تولد" }));
    fireEvent.click(screen.getByRole("button", { name: "کلیک روی کیک تولد" }));
    await act(async () => { vi.advanceTimersByTime(1100); });
    const motor = screen.getByRole("button", { name: "برای پخش صدای موتور نگه دارید" });
    Object.defineProperty(motor, "setPointerCapture", { configurable: true, value: () => { throw new Error("unsupported pointer capture"); } });

    const dragEvent = new Event("dragstart", { bubbles: true, cancelable: true });
    const contextEvent = new Event("contextmenu", { bubbles: true, cancelable: true });
    motor.dispatchEvent(dragEvent);
    motor.dispatchEvent(contextEvent);
    expect(dragEvent.defaultPrevented).toBe(true);
    expect(contextEvent.defaultPrevented).toBe(true);

    fireEvent.pointerDown(motor, { pointerId: 4 });
    await act(async () => undefined);
    expect(play).toHaveBeenCalled();
    expect(screen.getByText("در حال پخش…")).toBeTruthy();
  });
});
