import { BIRTHDAY_CAKE_SOUND_URL, BIRTHDAY_MOTOR_SOUND_URL, BIRTHDAY_OWNER, birthdayImageUrl, nextBirthdayStage, type BirthdayContentRecord, type BirthdayStage } from "@/lib/birthday";
import { stopAndResetBirthdayAudio } from "@/lib/birthdayAudio";
import { trpc } from "@/lib/trpc";
import { CakeSlice, Heart, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/contexts/LocaleContext";

type BirthdayPageContentProps = {
  content: BirthdayContentRecord;
};

function MissingAsset({ label }: { label: string }) {
  return <div className="grid aspect-[4/3] w-full place-items-center rounded-[2rem] border border-dashed border-white/25 bg-white/10 p-8 text-center text-sm font-bold leading-7 text-white/75">{label}<br />این بخش هنوز کامل نشده است.</div>;
}

export function BirthdayPageContent({ content }: BirthdayPageContentProps) {
  const { dir } = useLocale();
  const [stage, setStage] = useState<BirthdayStage>("cat");
  const [cakeCrossed, setCakeCrossed] = useState(false);
  const [engineHolding, setEngineHolding] = useState(false);
  const cakeAudioRef = useRef<HTMLAudioElement>(null);
  const engineAudioRef = useRef<HTMLAudioElement>(null);
  const cakeTimerRef = useRef<number | null>(null);

  const stopEngine = () => {
    stopAndResetBirthdayAudio(engineAudioRef.current);
    setEngineHolding(false);
  };

  useEffect(() => {
    const onVisibilityChange = () => { if (document.hidden) stopEngine(); };
    window.addEventListener("blur", stopEngine);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", stopEngine);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (cakeTimerRef.current !== null) window.clearTimeout(cakeTimerRef.current);
      stopAndResetBirthdayAudio(cakeAudioRef.current);
      stopAndResetBirthdayAudio(engineAudioRef.current);
    };
  }, []);

  const showCake = () => setStage("cake");

  const activateCake = () => {
    if (cakeCrossed) return;
    setCakeCrossed(true);
    const audio = cakeAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    }
    cakeTimerRef.current = window.setTimeout(() => setStage(nextBirthdayStage("cake")), 1100);
  };

  const startEngine = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Some browser preview environments do not expose a capturable pointer.
    }
    const audio = engineAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().then(() => setEngineHolding(true)).catch(() => setEngineHolding(false));
  };

  const resetExperience = () => {
    if (cakeTimerRef.current !== null) window.clearTimeout(cakeTimerRef.current);
    stopAndResetBirthdayAudio(cakeAudioRef.current);
    stopEngine();
    setCakeCrossed(false);
    setStage("cat");
  };

  const catImage = birthdayImageUrl(content.catImageKey);
  const cakeImage = birthdayImageUrl(content.cakeImageKey);
  const motorImage = birthdayImageUrl(content.motorImageKey);

  return (
    <main dir={dir} className={`min-h-screen overflow-x-hidden transition-colors duration-700 ${stage === "motor" ? "bg-[#050509] text-white" : "bg-[#f7f3ff] text-[#38276f]"}`}>
      <audio ref={cakeAudioRef} src={BIRTHDAY_CAKE_SOUND_URL} preload="auto" />
      <audio ref={engineAudioRef} src={BIRTHDAY_MOTOR_SOUND_URL} preload="auto" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-10">
        {stage !== "motor" && <><div className="pointer-events-none absolute -right-36 -top-40 h-[29rem] w-[29rem] rounded-full bg-[#f0b7ec]/70 blur-3xl" /><div className="pointer-events-none absolute -bottom-44 -left-36 h-[28rem] w-[28rem] rounded-full bg-[#b9cbff]/70 blur-3xl" /></>}
        {stage === "motor" && <><div className="pointer-events-none absolute -right-28 top-8 h-72 w-72 rounded-full bg-[#9b5cff]/20 blur-3xl" /><div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[#355cff]/20 blur-3xl" /></>}

        <header className="relative flex min-w-0 items-center justify-between gap-3">
          <Link href="/" className={`inline-flex items-center gap-2 font-black tracking-tight ${stage === "motor" ? "text-white" : "text-[#37266f]"}`}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#9b5cff,#f05ba8,#5e7dff)] text-white shadow-[0_12px_24px_rgba(142,90,255,.3)]"><Heart className="h-5 w-5 fill-current" /></span><span>برای تو</span></Link>
          <div className="flex items-center gap-2"><LanguageSwitcher compact /><button type="button" onClick={resetExperience} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition hover:scale-[1.02] active:scale-[.97] ${stage === "motor" ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10" : "border-[#ded2ff] bg-white/75 text-[#7553cc] hover:bg-white"}`}><RotateCcw className="h-3.5 w-3.5" /> از اول</button></div>
        </header>

        <section className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center py-12 text-center sm:py-16">
          {stage === "cat" && <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="mb-5 text-sm font-black text-[#7a57d2]">برای آدین</p>
            <button type="button" onClick={showCake} className="group mx-auto block w-full max-w-sm rounded-[2.2rem] bg-transparent outline-none transition duration-300 hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[#9b5cff]/30 active:scale-[.98]" aria-label="رفتن به کیک تولد">
              {catImage ? <img src={catImage} draggable={false} alt="گربه‌ی طوسی با کلاه تولد" className="h-auto max-h-[56vh] w-auto max-w-full object-contain mix-blend-multiply drop-shadow-[0_20px_35px_rgba(121,84,218,.24)] [-webkit-user-drag:none]" /> : <MissingAsset label="تصویر گربه" />}
            </button>
            <p className="mt-6 text-3xl font-black tracking-tight text-[#3c2a77] sm:text-4xl">{content.catText}</p>
            <p className="mt-3 text-sm text-[#766894]">روی گربه بزن</p>
          </div>}

          {stage === "cake" && <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <p className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#7a57d2]"><Sparkles className="h-4 w-4" /> مرحله‌ی دوم</p>
            <button type="button" onClick={activateCake} disabled={cakeCrossed} className="group relative mx-auto block w-full max-w-xl rounded-[2.2rem] bg-transparent outline-none transition duration-300 hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[#f05ba8]/30 active:scale-[.98] disabled:cursor-default" aria-label="کلیک روی کیک تولد">
              {cakeImage ? <img src={cakeImage} draggable={false} alt="کیک تولد" className={`h-auto max-h-[56vh] w-auto max-w-full object-contain mix-blend-multiply drop-shadow-[0_20px_35px_rgba(221,84,160,.22)] transition [-webkit-user-drag:none] ${cakeCrossed ? "brightness-75" : ""}`} /> : <MissingAsset label="تصویر کیک" />}
              {cakeCrossed && <span data-testid="cake-cross-overlay" className="absolute inset-0 grid place-items-center rounded-[2.2rem] bg-black/25 text-white animate-in fade-in zoom-in-75 duration-300"><X strokeWidth={3} className="h-28 w-28 drop-shadow-[0_8px_20px_rgba(0,0,0,.55)] sm:h-36 sm:w-36" /></span>}
            </button>
            <p className="mt-6 text-3xl font-black tracking-tight text-[#3c2a77] sm:text-4xl">{content.cakeText}</p>
            <p className="mt-3 text-sm text-[#766894]">{cakeCrossed ? "یه لحظه…" : "روی کیک بزن"}</p>
          </div>}

          {stage === "motor" && <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
            <p className="mb-6 text-5xl font-black tracking-tight text-white sm:text-6xl">{content.motorText}</p>
            <p className="mb-7 text-sm font-bold text-white/55">روی موتور نگه دار تا صداش رو بشنوی</p>
            <button type="button" onPointerDown={startEngine} onPointerUp={stopEngine} onPointerCancel={stopEngine} onPointerLeave={stopEngine} onLostPointerCapture={stopEngine} onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()} className={`relative mx-auto block w-full max-w-2xl touch-none select-none bg-transparent outline-none transition duration-300 focus-visible:ring-4 focus-visible:ring-[#a883ff]/60 active:scale-[.985] [-webkit-touch-callout:none] [-webkit-user-drag:none] ${engineHolding ? "-translate-y-1 drop-shadow-[0_0_35px_rgba(155,92,255,.5)]" : "drop-shadow-[0_20px_35px_rgba(0,0,0,.55)]"}`} aria-label="برای پخش صدای موتور نگه دارید">
              {motorImage ? <img src={motorImage} draggable={false} alt="موتور مشکی" className={`h-auto max-h-[56vh] w-auto max-w-full object-contain transition [-webkit-user-drag:none] ${engineHolding ? "brightness-110" : "brightness-90"}`} /> : <MissingAsset label="تصویر موتور" />}
              <span className={`pointer-events-none absolute bottom-4 right-4 rounded-full px-4 py-2 text-xs font-black backdrop-blur transition ${engineHolding ? "bg-[#9b5cff] text-white" : "bg-black/55 text-white/80"}`}>{engineHolding ? "در حال پخش…" : "نگه دار"}</span>
            </button>
          </div>}
        </section>
      </div>
    </main>
  );
}

export default function BirthdayPage() {
  const { data, isLoading } = trpc.birthday.get.useQuery({ owner: BIRTHDAY_OWNER });
  const { dir } = useLocale();
  if (isLoading || !data) return <main dir={dir} className="grid min-h-screen place-items-center bg-[#f7f3ff]"><Loader2 className="h-7 w-7 animate-spin text-[#8d5cf1]" /></main>;
  return <BirthdayPageContent content={data} />;
}
