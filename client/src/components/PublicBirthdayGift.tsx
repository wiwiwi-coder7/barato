import { giftImageUrl, type GiftRecord } from "@/lib/gift";
import { DEFAULT_BIRTHDAY_PUBLIC_SETTINGS } from "@/lib/publicBirthday";
import { trpc } from "@/lib/trpc";
import { CakeSlice, Mic, Volume2 } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import React, { useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/contexts/LocaleContext";

type PublicBirthdayGiftProps = { gift: GiftRecord };

export function PublicBirthdayGift({ gift }: PublicBirthdayGiftProps) {
  const { dir } = useLocale();
  const [started, setStarted] = useState(false);
  const [blownOut, setBlownOut] = useState(false);
  const [microphoneMessage, setMicrophoneMessage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const { data: publicSettings } = trpc.birthday.settings.useQuery();
  const settings = publicSettings ?? DEFAULT_BIRTHDAY_PUBLIC_SETTINGS;

  const stopListening = () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
  };

  const blowOut = () => {
    if (blownOut) return;
    stopListening();
    setBlownOut(true);
  };

  const beginBirthday = async () => {
    if (started) return;
    setStarted(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophoneMessage("میکروفون این دستگاه در دسترس نیست؛ می‌توانی دکمهٔ خاموش‌کردن شمع را بزنی.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      streamRef.current = stream;
      contextRef.current = context;

      const measure = () => {
        analyser.getByteTimeDomainData(samples);
        const level = Math.sqrt(
          samples.reduce((sum, value) => sum + Math.pow((value - 128) / 128, 2), 0) / samples.length,
        );
        if (level > 0.13) {
          blowOut();
          return;
        }
        frameRef.current = window.requestAnimationFrame(measure);
      };

      frameRef.current = window.requestAnimationFrame(measure);
    } catch {
      setMicrophoneMessage("اجازهٔ میکروفون داده نشد؛ دکمهٔ خاموش‌کردن شمع همچنان کار می‌کند.");
    }
  };

  useEffect(() => () => stopListening(), []);

  const cakeImage = giftImageUrl(gift.birthdayCakeKey ?? gift.imageKey);

  return (
    <main
      dir={dir}
      style={{ background: `radial-gradient(circle at 12% 12%, #f8b8d8 0%, transparent 30%), radial-gradient(circle at 85% 78%, #aec4ff 0%, transparent 34%), ${settings.backgroundColor}` }}
      className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-8 text-[#443472]"
    >
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#ffd2eb]/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#d8ddff]/80 blur-3xl" />
      <div className="absolute top-5 z-20"><LanguageSwitcher compact /></div>

      <section className="relative w-full max-w-xl text-center">
        {!blownOut ? (
          <>
            <h1 className="text-balance text-4xl font-black leading-[1.35] sm:text-6xl">
              {settings.candlePrompt}
            </h1>
            <div className="relative mx-auto mt-8 grid h-72 w-72 place-items-center overflow-hidden rounded-[2.5rem] border border-white/40 bg-[radial-gradient(circle_at_50%_40%,#c947ab_0%,#8d1f85_54%,#42104d_100%)] shadow-[0_24px_60px_rgba(130,34,120,.32)]">
              <DotLottieReact
                src="https://assets-v2.lottiefiles.com/a/f3597bd8-1180-11ee-a4b6-2f3522b64896/CFTph21fSM.lottie"
                autoplay
                loop
                className="h-full w-full"
                aria-label="انیمیشن شمع روشن"
              />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-balance text-4xl font-black leading-[1.35] sm:text-6xl">
              تولدت مبارک {gift.name}
            </h1>
            {gift.personalMessage && (
              <p className="mx-auto mt-5 max-w-lg text-base leading-8 text-[#715d98]">{gift.personalMessage}</p>
            )}
            <div className="relative mx-auto mt-10 w-full max-w-md rounded-[2rem] bg-white/65 p-4 shadow-[0_24px_60px_rgba(177,104,180,.18)] backdrop-blur">
              <img src={cakeImage ?? ""} alt="کیک تولد" className="mx-auto aspect-square w-full rounded-[1.4rem] object-contain" />
              <div className="absolute inset-x-0 top-6 animate-in fade-in zoom-in-90 duration-500">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#ffffffdf] px-4 py-2 text-sm font-black text-[#d45490] shadow-lg">
                  <CakeSlice className="h-4 w-4" /> آرزوت را کردی؛ تولدت مبارک
                </div>
              </div>
            </div>
          </>
        )}

        {!blownOut && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => void beginBirthday()}
              disabled={started}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-[linear-gradient(100deg,#ee6dab,#8e65ff,#6c94ff)] px-6 font-black text-white shadow-[0_14px_28px_rgba(142,92,255,.26)] transition hover:brightness-105 disabled:cursor-default disabled:opacity-65"
            >
              <Mic className="h-4 w-4" /> خاموش کردن با فوت
            </button>
            <button
              type="button"
              onClick={blowOut}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#7557b9] underline decoration-[#c6b8ed] underline-offset-4"
            >
              <Volume2 className="h-4 w-4" /> خاموش‌کردن شمع بدون میکروفون
            </button>
            {microphoneMessage && <p className="max-w-sm text-xs leading-6 text-[#8d79aa]">{microphoneMessage}</p>}
          </div>
        )}
      </section>
    </main>
  );
}
