import { ArrowDown, CakeSlice, ChevronDown, Heart, Volume2, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Phase = "cake" | "crash" | "letters";

type CharacterLetter = {
  name: string;
  role: string;
  image: string;
  accent: string;
  message: string;
};

const letters: CharacterLetter[] = [
  {
    name: "Levi Ackerman",
    role: "کاپیتان جوخه‌ی شناسایی",
    image: "/erika/levi.png",
    accent: "#b7c7d6",
    message: "هی، اریکا. تولدت مبارک. من معمولاً اهل این حرف‌ها نیستم، پس خوب گوش کن. امیدوارم امسال کمتر خودت رو درگیر چیزهای بی‌ارزش کنی، بیشتر لبخند بزنی و آدم‌هایی که برات مهمن رو نزدیک خودت نگه داری. خوشحال باش، اریکا... این یه دستوره. و یه چیز دیگه... اتاقت رو تمیز نگه دار.",
  },
  {
    name: "Hange Zoe",
    role: "فرمانده‌ی کنجکاو و دیوانه‌ی آزمایش‌ها",
    image: "/erika/hange.png",
    accent: "#8ed2a7",
    message: "اریییکاااااا! تولدت مبارکککک! می‌دونی چقدر هیجان‌انگیزه که یه سال دیگه از زندگیت رو پشت سر گذاشتی؟ امیدوارم امسالت پر از ماجراجویی، خنده و اتفاق‌های شگفت‌انگیز باشه! البته قول می‌دم این بار تو رو سوژه‌ی آزمایش نکنم... شاید! دوستت دارم، تولدت مبارک!",
  },
  {
    name: "Mikasa Ackerman",
    role: "محافظ همیشگی",
    image: "/erika/mikasa.png",
    accent: "#e8a4b8",
    message: "تولدت مبارک، اریکا. امیدوارم همیشه آدم‌هایی کنارت باشن که بتونی پیششون احساس امنیت کنی و بدون ترس خودت باشی. تو لایق آرامشی هستی که این دنیا خیلی وقت‌ها از آدم‌ها می‌گیره. بیشتر از همیشه مراقب خودت باش و یادت نره که بودنت برای آدم‌هایی که دوستت دارن، ارزشمنده.",
  },
  {
    name: "Eren Yeager",
    role: "برای آزادی",
    image: "/erika/eren.png",
    accent: "#ef735f",
    message: "اریکااا! تولدت مبارک! یه سال دیگه گذشت، ولی این تازه شروع ماجراست! امیدوارم امسال برای رسیدن به آرزوهات بجنگی، از هیچ‌چیزی نترسی و اجازه ندی کسی بهت بگه چه کاری ازت برمیاد و چه کاری نه. زندگی مال خودته؛ آزاد باش، اشتباه کن، بلند شو و دوباره ادامه بده. برای آزادی، برای رؤیاهات و برای خودت بجنگ!",
  },
  {
    name: "Armin Arlert",
    role: "کوچک‌ترین نور در تاریکی",
    image: "/erika/armin.png",
    accent: "#79b7dc",
    message: "تولدت مبارک، اریکا! برای سال جدیدت آرزو می‌کنم دنیا رو با چشم‌هایی پر از امید ببینی و هیچ‌وقت کنجکاوی و رؤیاپردازی رو کنار نذاری. دنیا با همه‌ی سختی‌هاش هنوز پر از چیزهای قشنگیه که ارزش کشف کردن دارن. حتی کوچک‌ترین نور هم می‌تونه تاریکی بزرگی رو شکست بده. امیدوارم همیشه نور زندگی خودت باشی.",
  },
];

function CakeScene({ onBlow }: { onBlow: () => void }) {
  const [micMessage, setMicMessage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  const stopListening = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
  };

  const blowWithMic = async () => {
    setMicMessage(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("no microphone");
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
        const level = Math.sqrt(samples.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / samples.length);
        if (level > 0.13) {
          stopListening();
          onBlow();
          return;
        }
        frameRef.current = requestAnimationFrame(measure);
      };
      frameRef.current = requestAnimationFrame(measure);
    } catch {
      setMicMessage("اگر اجازه‌ی میکروفون را نمی‌دهی، از دکمه‌ی خاموش‌کردن شمع استفاده کن.");
    }
  };

  useEffect(() => () => stopListening(), []);

  return (
    <main dir="rtl" className="erika-cake-screen">
      <div className="erika-stars" aria-hidden="true" />
      <div className="erika-cake-copy">
        <p className="erika-kicker">یک پیام از جوخه‌ی شناسایی</p>
        <h1>تولدت مبارک <span>اریکا</span></h1>
        <p className="erika-instruction">یه آرزو کن و شمع‌ها رو فوت کن</p>
        <div className="erika-cake" role="img" aria-label="کیک تولد با شمع‌های روشن">
          <div className="erika-flames"><i /><i /><i /><i /><i /></div>
          <div className="erika-candles"><b /><b /><b /><b /><b /></div>
          <div className="erika-frosting" />
          <div className="erika-cake-body"><CakeSlice className="h-10 w-10 text-white/80" /><span>ERIKA</span></div>
          <div className="erika-plate" />
        </div>
        <div className="erika-cake-actions">
          <button type="button" className="erika-primary-button" onClick={blowWithMic}><Wind className="h-5 w-5" /> خاموش کردن با فوت</button>
          <button type="button" className="erika-quiet-button" onClick={onBlow}>خاموش‌کردن شمع بدون میکروفون</button>
          {micMessage && <p className="erika-mic-message">{micMessage}</p>}
        </div>
      </div>
      <p className="erika-scroll-hint"><ChevronDown className="h-4 w-4" /> بعدش یه سورپرایز منتظرته</p>
    </main>
  );
}

function CrashScene() {
  return (
    <main dir="ltr" className="erika-crash-screen">
      <div className="erika-crash-noise" />
      <div className="erika-crash-content">
        <p className="erika-crash-code">FATAL_EXCEPTION // WALL_MARIA_845</p>
        <div className="erika-crash-face">:(</div>
        <h1>Something went terribly wrong.</h1>
        <p>Don&apos;t worry, Erika. This was not a bug.</p>
        <p>It was the beginning of your next chapter.</p>
        <div className="erika-crash-progress"><span /></div>
        <p className="erika-crash-percent">rebuilding freedom... 100%</p>
      </div>
    </main>
  );
}

function LetterCard({ letter, index }: { letter: CharacterLetter; index: number }) {
  return (
    <article className="erika-letter-card" style={{ "--accent": letter.accent } as React.CSSProperties}>
      <div className="erika-character-panel">
        <span className="erika-card-number">0{index + 1}</span>
        <img src={letter.image} alt={letter.name} />
        <div className="erika-character-caption"><strong>{letter.name}</strong><small>{letter.role}</small></div>
      </div>
      <div className="erika-message-panel">
        <span className="erika-quote-mark">“</span>
        <p>{letter.message}</p>
        <div className="erika-message-line" />
        <small>با عشق، از طرف جوخه‌ی شناسایی</small>
      </div>
    </article>
  );
}

function LettersScene() {
  return (
    <main dir="rtl" className="erika-letters-screen">
      <div className="erika-letter-glow" />
      <header className="erika-letters-header">
        <div className="erika-brand-mark"><Heart className="h-4 w-4 fill-current" /> برای اریکا</div>
        <div className="erika-now-playing"><Volume2 className="h-4 w-4" /> موسیقی برای تو در حال پخش است</div>
      </header>
      <section className="erika-hero-letter">
        <img src="/erika/erika-banner.png" alt="ERIKA Wings of Freedom" />
        <p>برای یک روز، تمام دنیا را فراموش کن و فقط از زنده بودن، دوست داشته شدن و خودت بودن لذت ببر.</p>
        <div className="erika-scroll-prompt"><ArrowDown className="h-4 w-4" /> اسکرول کن، نامه‌ها منتظرند</div>
      </section>
      <section className="erika-letters-list">
        <p className="erika-section-label">THE SCOUT REGIMENT · 30.10</p>
        <h2>نامه‌هایی از آن سوی دیوارها</h2>
        <p className="erika-section-intro">هرکدامشان چیزی برای گفتن به تو دارند، اریکا.</p>
        {letters.map((letter, index) => <LetterCard key={letter.name} letter={letter} index={index} />)}
      </section>
      <section className="erika-final-letter">
        <div className="erika-final-divider"><span>و در آخر، از طرف من</span></div>
        <h2>نامه‌ای که فقط برای توست</h2>
        <img src="/erika/letter.png" alt="نامه‌ی دست‌نویس برای اریکا" />
        <p className="erika-final-signature">Happy birthday, erika <span>♥</span></p>
      </section>
      <footer className="erika-footer">FOR ERIKA · WITH LOVE · ALWAYS</footer>
    </main>
  );
}

export default function ErikaBirthdayPage() {
  const [phase, setPhase] = useState<Phase>("cake");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startMusicAndBlow = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/erika/music.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.68;
    }
    void audioRef.current.play().catch(() => undefined);
    setPhase("crash");
    window.setTimeout(() => setPhase("letters"), 2600);
  };

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  if (phase === "cake") return <CakeScene onBlow={startMusicAndBlow} />;
  if (phase === "crash") return <CrashScene />;
  return <LettersScene />;
}
