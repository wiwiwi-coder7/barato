import { giftDisplayText, giftImageUrl, MUSIC_CLIP_URL, type GiftRecord } from "@/lib/gift";
import { createGiftMomentCycle, shouldShowGiftStartHint, startGiftAudio } from "@/lib/giftMoment";
import { createFloatingWord, finishFloatingStream, FLOATING_STREAM_DELAY_MS, FLOATING_STREAM_INTERVAL_MS, type FloatingWord } from "@/lib/floatingStream";
import { trpc } from "@/lib/trpc";
import { PublicBirthdayGift } from "@/components/PublicBirthdayGift";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/contexts/LocaleContext";
import { DEFAULT_GIFT_COLOR, isApprovedGiftColor } from "@shared/colors";
import { useEffect, useRef, useState } from "react";
import { Link, useRoute } from "wouter";

function MissingGift() {
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_18%_16%,#d95da9_0%,transparent_35%),radial-gradient(circle_at_82%_80%,#5a78ff_0%,transparent_40%),#42318c] px-6 text-center text-white">
      <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-9 shadow-2xl backdrop-blur">
        <p className="mb-3 text-sm font-bold text-[#f7b6df]">برای تو</p>
        <h1 className="text-3xl font-black">این لینک در دسترس نیست</h1>
        <p className="mt-4 leading-8 text-white/70">ممکن است آدرس نادرست باشد یا این لینک دیگر فعال نباشد.</p>
        <Link href="/" className="mt-7 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-[#5941ae]">ساخت لینک شخصی</Link>
      </div>
    </main>
  );
}

export default function GiftPage() {
  const [, params] = useRoute("/gift/:token");
  const token = params?.token ?? "";
  const { data: gift, isLoading } = trpc.gifts.getByToken.useQuery({ token }, { enabled: Boolean(token), refetchOnWindowFocus: false, retry: false });
  const recordVisit = trpc.gifts.recordVisit.useMutation();
  const visitRecordedFor = useRef<string | null>(null);
  const [streamStarted, setStreamStarted] = useState(false);
  const [floatingWords, setFloatingWords] = useState<FloatingWord[]>([]);
  const [visibleMessageLines, setVisibleMessageLines] = useState(0);
  const { locale, dir } = useLocale();
  const stopFloatingStream = () => {
    const finished = finishFloatingStream();
    setStreamStarted(finished.started);
    setFloatingWords(finished.words);
  };
  const audioRef = useRef<HTMLAudioElement>(null);
  const wordSequence = useRef(0);
  const momentCycle = useRef(createGiftMomentCycle());

  const playMoment = () => {
    if (!momentCycle.current.start()) return;
    const audio = audioRef.current;
    wordSequence.current = 0;
    setFloatingWords([]);
    setVisibleMessageLines(0);
    setStreamStarted(true);
    startGiftAudio(audio);
  };

  const finishMoment = () => {
    momentCycle.current.finish();
    wordSequence.current = 0;
    stopFloatingStream();
  };

  useEffect(() => {
    if (gift && visitRecordedFor.current !== token) {
      visitRecordedFor.current = token;
      recordVisit.mutate({ token });
    }
  }, [gift, token]);

  useEffect(() => {
    if (!streamStarted) return;

    let intervalId: number | undefined;
    const spawnWord = () => {
      const word = createFloatingWord(wordSequence.current);
      wordSequence.current += 1;
      setFloatingWords(current => [...current, word].slice(-64));
    };
    const delayId = window.setTimeout(() => {
      spawnWord();
      intervalId = window.setInterval(spawnWord, FLOATING_STREAM_INTERVAL_MS);
    }, FLOATING_STREAM_DELAY_MS);

    return () => {
      window.clearTimeout(delayId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [streamStarted]);

  const personalMessage = gift ? (gift as GiftRecord).personalMessage ?? "" : "";
  const messageLines: string[] = personalMessage.split(/\r?\n/).map((line: string) => line.trim()).filter(Boolean);
  useEffect(() => {
    if (!streamStarted || messageLines.length === 0) return;
    const timers: number[] = messageLines.map((_: string, index: number) => window.setTimeout(() => setVisibleMessageLines(index + 1), 360 + index * 360));
    return () => timers.forEach((timer: number) => window.clearTimeout(timer));
  }, [streamStarted, personalMessage]);

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#42318c] text-white">در حال باز کردن هدیه…</main>;
  }
  if (!gift) return <MissingGift />;

  const typedGift = gift as GiftRecord;
  if (typedGift.experience === "birthday") return <PublicBirthdayGift gift={typedGift} />;
  const isDark = typedGift.theme === "dark";
  const giftColor = isApprovedGiftColor(typedGift.color) ? typedGift.color : DEFAULT_GIFT_COLOR;
  const imageUrl = giftImageUrl(typedGift.imageKey);
  const surfaceStyle = {
    background: isDark
      ? "radial-gradient(circle at 18% 16%, #d45da8 0%, transparent 34%), radial-gradient(circle at 80% 78%, #5475ff 0%, transparent 38%), #42318c"
      : "radial-gradient(circle at 18% 16%, #f6c8ed 0%, transparent 36%), radial-gradient(circle at 80% 78%, #cfdcff 0%, transparent 38%), #f8f5ff",
  };

  return (
    <main
      dir={dir}
      onClick={playMoment}
      className={`gift-stage absolute inset-0 grid min-h-screen w-screen cursor-pointer place-items-center overflow-hidden px-5 ${isDark ? "text-white" : "text-[#41327d]"}`}
      style={{ "--gift-color": giftColor, ...surfaceStyle } as React.CSSProperties}
    >
      <audio ref={audioRef} src={MUSIC_CLIP_URL} preload="auto" onEnded={finishMoment} />
      <div className="absolute top-5 z-20"><LanguageSwitcher compact /></div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {floatingWords.map(word => (
          <span
            key={word.id}
            className="love-float absolute bottom-[-3rem] whitespace-nowrap font-black tracking-[0.22em]"
            style={{
              left: `${word.left}%`,
              animationDuration: `${word.duration}s`,
              fontSize: `${word.size}rem`,
            } as React.CSSProperties}
            onAnimationEnd={() => setFloatingWords(current => current.filter(item => item.id !== word.id))}
          >
            I LOVE YOU
          </span>
        ))}
      </div>

      <section className="relative z-10 max-w-4xl text-center">
        {imageUrl && <div className="mx-auto mb-7 h-28 w-28 overflow-hidden rounded-[2rem] border-2 border-white/65 bg-white/20 p-1 shadow-[0_0_32px_color-mix(in_srgb,var(--gift-color),transparent_52%)] sm:h-36 sm:w-36"><img src={imageUrl} alt="تصویر شخصی" className="h-full w-full rounded-[1.65rem] object-cover" /></div>}
        <button type="button" className="group focus:outline-none" onClick={event => { event.stopPropagation(); void playMoment(); }} aria-label="باز کردن هدیه">
          <h1 className="gift-message text-balance text-5xl font-black leading-[1.45] sm:text-7xl lg:text-8xl">
            {giftDisplayText(typedGift.name, locale)}
          </h1>
          {shouldShowGiftStartHint(streamStarted) && <span className={`mt-8 inline-block text-sm font-bold transition group-hover:scale-105 ${isDark ? "text-white/60" : "text-[#6d62a4]"}`}>روی متن بزن تا شروع شود</span>}
        </button>
        {streamStarted && messageLines.length > 0 && <div className={`mx-auto mt-6 max-w-xl space-y-2 text-balance text-base leading-8 sm:text-lg ${isDark ? "text-white/80" : "text-[#5f5289]"}`}>{messageLines.slice(0, visibleMessageLines).map((line: string, index: number) => <p key={`${index}-${line}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300">{line}</p>)}</div>}
      </section>
    </main>
  );
}
