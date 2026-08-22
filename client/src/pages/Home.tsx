import { Button } from "@/components/ui/button";
import { BirthdayGiftOptions } from "@/components/BirthdayGiftOptions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useLocale } from "@/contexts/LocaleContext";
import { createTextGiftPayload } from "@/lib/fastGiftCreation";
import { PERSONAL_MESSAGE_MAX_LENGTH, giftUrl, type GiftRecord, type GiftTheme } from "@/lib/gift";
import { isValidBirthdayAge, type GiftExperience } from "@/lib/publicBirthday";
import type { CreatedGiftRecord } from "@/lib/standaloneApi";
import { fileToBase64, validateGiftImage } from "@/lib/imageUpload";
import { PRIVACY_NOTICE } from "@/lib/privacyNotice";
import { trpc } from "@/lib/trpc";
import { DEFAULT_GIFT_COLOR, GIFT_COLOR_META } from "@shared/colors";
import { Check, Copy, ImagePlus, Link2, Loader2, LockKeyhole, MoonStar, SunMedium, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const THEMES: { value: GiftTheme; title: string; subtitle: string; icon: typeof SunMedium }[] = [
  { value: "light", title: "روشن و لطیف", subtitle: "صورتی، بنفش و آبی", icon: SunMedium },
  { value: "dark", title: "بنفش و رویایی", subtitle: "عمیق، آرام و درخشان", icon: MoonStar },
];

export default function Home() {
  const [name, setName] = useState("");
  const [experience, setExperience] = useState<GiftExperience>("gift");
  const [birthdayAge, setBirthdayAge] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [color, setColor] = useState<(typeof GIFT_COLOR_META)[number]["value"]>(DEFAULT_GIFT_COLOR);
  const [theme, setTheme] = useState<GiftTheme>("light");
  const [expiresAt, setExpiresAt] = useState("");
  const [gift, setGift] = useState<GiftRecord | null>(null);
  const [personalMessage, setPersonalMessage] = useState("");
  const { dir, formatting } = useLocale();
  const personalMessageTextarea = useAutoResizeTextarea(personalMessage);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [premiumPassword, setPremiumPassword] = useState("");
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageAttachmentStatus, setImageAttachmentStatus] = useState<"idle" | "uploading" | "attached" | "failed">("idle");
  const [pendingImage, setPendingImage] = useState<{ created: CreatedGiftRecord; file: File; target: "gift" | "birthdayCake" } | null>(null);
  const isDarkTheme = theme === "dark";
  const warmApi = trpc.gifts.warm.useMutation();
  const createGift = trpc.gifts.create.useMutation({
    onSuccess: (result: GiftRecord) => {
      setGift(result as GiftRecord);
      toast.success("لینک شخصی‌ات آماده شد.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const unlockImage = trpc.gifts.unlockImage.useMutation({
    onSuccess: () => { setPremiumUnlocked(true); setPremiumPassword(""); toast.success("قابلیت تصویر باز شد."); },
    onError: (error: Error) => toast.error(error.message),
  });
  const uploadImage = trpc.gifts.uploadImage.useMutation();
  const attachImage = trpc.gifts.attachImage.useMutation();
  const { data: birthdaySettings, isLoading: birthdaySettingsLoading } = trpc.birthday.settings.useQuery();
  const { data: birthdayPresets, isLoading: birthdayPresetsLoading } = trpc.birthday.presets.useQuery(undefined, { enabled: Boolean(birthdaySettings?.isEnabled) });
  const birthdayEnabled = Boolean(birthdaySettings?.isEnabled);
  const presets = birthdayPresets ?? [];
  const selectedPreset = presets.find(preset => preset.id === selectedPresetId) ?? null;

  useEffect(() => { warmApi.mutate(undefined); }, []);

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!premiumUnlocked) {
      toast.error("برای بارگذاری تصویر ابتدا رمز قابلیت تصویر را وارد کنید.");
      event.target.value = "";
      return;
    }
    const validationError = validateGiftImage(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const attachImageInBackground = async (created: CreatedGiftRecord, file: File, target: "gift" | "birthdayCake" = "gift") => {
    setImageAttachmentStatus("uploading");
    setPendingImage({ created, file, target });
    try {
      const upload = await uploadImage.mutateAsync({ mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64: await fileToBase64(file) });
      const updated = await attachImage.mutateAsync({ giftToken: created.token, creatorToken: created.creatorToken, imageKey: upload.key, target });
      setGift(updated);
      setPendingImage(null);
      setImageAttachmentStatus("attached");
      toast.success(target === "birthdayCake" ? "تصویر دلخواه کیک اضافه شد." : "تصویر هم به هدیه اضافه شد.");
    } catch (error) {
      setImageAttachmentStatus("failed");
      toast.error(error instanceof Error ? `لینک آماده است؛ افزودن تصویر انجام نشد: ${error.message}` : "لینک آماده است؛ افزودن تصویر انجام نشد.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setImageAttachmentStatus("idle");
      if (experience === "birthday" && (!birthdayEnabled || !isValidBirthdayAge(Number(birthdayAge)) || !selectedPreset)) {
        toast.error("برای ساخت لینک تولد، سن و کیک را انتخاب کن.");
        return;
      }
      const created = await createGift.mutateAsync(createTextGiftPayload({ name, personalMessage: personalMessage.trim() || null, color, theme, expiresAt: expiresAt ? new Date(expiresAt) : null, experience, birthdayAge: experience === "birthday" ? Number(birthdayAge) : null, birthdayCakeKey: experience === "birthday" ? selectedPreset?.imageKey ?? null : null, birthdayHasBuiltinCandles: experience === "birthday" ? Boolean(selectedPreset?.hasBuiltinCandles) : false })) as CreatedGiftRecord;
      if (imageFile) void attachImageInBackground(created, imageFile, experience === "birthday" ? "birthdayCake" : "gift");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ساخت هدیه انجام نشد.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = () => {
    if (!gift) return;
    navigator.clipboard.writeText(giftUrl(gift.token)).then(() => toast.success("لینک کپی شد."));
  };

  return (
    <main dir={dir} className={`min-h-screen overflow-hidden transition-colors duration-500 ${isDarkTheme ? "bg-[#29206e] text-white" : "bg-[#f7f3ff] text-[#38276f]"}`}>
      <div className="relative mx-auto min-h-screen max-w-[1440px] px-5 pb-12 pt-6 sm:px-10 lg:px-16">
        <div className={`pointer-events-none absolute -right-44 -top-44 h-[34rem] w-[34rem] rounded-full blur-3xl transition-colors duration-500 ${isDarkTheme ? "bg-[#c24dff]/65" : "bg-[#f4c6ff]"}`} />
        <div className={`pointer-events-none absolute -bottom-48 -left-40 h-[31rem] w-[31rem] rounded-full blur-3xl transition-colors duration-500 ${isDarkTheme ? "bg-[#5474ff]/65" : "bg-[#cbd8ff]"}`} />

        <header className="relative flex items-center justify-between gap-3">
          <Link href="/" className={`inline-flex items-center gap-2 font-black tracking-tight ${isDarkTheme ? "text-white" : "text-[#37266f]"}`}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#9b5cff,#f05ba8,#5e7dff)] text-white shadow-[0_12px_24px_rgba(142,90,255,.3)]"><Link2 className="h-5 w-5" /></span><span>برای تو</span></Link>
          <div className="flex items-center gap-2"><LanguageSwitcher compact /><Link href="/admin" className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold backdrop-blur transition ${isDarkTheme ? "border-white/25 bg-white/10 text-[#ffe5fa] hover:bg-white/20" : "border-[#dcd1ff] bg-white/70 text-[#6b46c9] hover:bg-white"}`}><LockKeyhole className="h-3.5 w-3.5" /> پنل مدیریت</Link></div>
        </header>

        <div className="relative mt-12 grid items-center gap-12 lg:mt-16 lg:grid-cols-[.95fr_1.05fr] lg:gap-20">
          <section className="order-2 lg:order-1">
            <p className={`text-sm font-bold ${isDarkTheme ? "text-[#ffcaed]" : "text-[#7654dc]"}`}>یک لینک شخصی، فقط برای یک نفر</p>
            <h1 className={`mt-3 text-balance text-5xl font-black leading-[1.3] tracking-tight sm:text-6xl ${isDarkTheme ? "text-white" : "text-[#37266f]"}`}>چیزی برای گفتن داری؟<br /><span className="bg-[linear-gradient(100deg,#925cff,#ef5da8,#5278ff)] bg-clip-text text-transparent">با یک لینک، خصوصی و ساده.</span></h1>
            <p className={`mt-6 max-w-xl text-base leading-8 ${isDarkTheme ? "text-white/75" : "text-[#64568d]"}`}>یک نام، رنگی که دوست داری و هر چیز کوچکی که می‌خواهی در این لینک خصوصی باقی بماند.</p>
            <div className={`mt-9 flex flex-wrap gap-3 text-sm font-bold ${isDarkTheme ? "text-[#f3eaff]" : "text-[#5f5792]"}`}><span className={`rounded-full px-4 py-2 shadow-sm ${isDarkTheme ? "bg-white/12" : "bg-white/80"}`}>لینک شخصی</span><span className={`rounded-full px-4 py-2 shadow-sm ${isDarkTheme ? "bg-white/12" : "bg-white/80"}`}>رنگ دلخواه</span><span className={`rounded-full px-4 py-2 shadow-sm ${isDarkTheme ? "bg-white/12" : "bg-white/80"}`}>پیام کوتاه</span></div>
          </section>

          <section className="order-1 rounded-[2rem] border border-white/75 bg-white/85 p-6 shadow-[0_28px_80px_rgba(112,91,215,.18)] backdrop-blur-xl sm:p-8 lg:order-2">
            <div className="mb-7 flex items-start justify-between"><div><p className="text-sm font-bold text-[#7654dc]">ساخت لینک شخصی</p><h2 className="mt-1 text-2xl font-black text-[#37266f]">لینکت را بساز</h2></div><Link2 className="h-7 w-7 text-[#9b5cff]" /></div>
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="space-y-2"><Label htmlFor="recipient-name" className="text-sm font-bold text-[#4c3d82]">نام یک نفر</Label><Input id="recipient-name" dir="rtl" value={name} maxLength={80} onChange={event => setName(event.target.value)} placeholder="مثلاً نرگس" className="h-13 rounded-xl border-[#d8d0ff] bg-white/80 px-4 text-base placeholder:text-[#a49bc8] focus-visible:ring-[#9560ff]" /><p className="text-xs text-[#756b9d]">آن‌چه در لینک دیده می‌شود، فقط برای همان نفر است.</p></div>
              {birthdaySettingsLoading ? <div className="grid h-24 place-items-center rounded-2xl border border-dashed border-[#d8d0ff] text-sm font-bold text-[#756b9d]">در حال آماده‌سازی تنظیمات تولد…</div> : birthdayEnabled ? <BirthdayGiftOptions experience={experience} onExperienceChange={value => { setExperience(value); if (value === "gift") { setBirthdayAge(""); setSelectedPresetId(null); } }} age={birthdayAge} onAgeChange={setBirthdayAge} presets={presets} selectedPresetId={selectedPresetId} onPresetChange={setSelectedPresetId} isLoading={birthdayPresetsLoading} /> : <div className="rounded-2xl border border-[#e5ddff] bg-[#fbf9ff] p-4 text-sm leading-7 text-[#756b9d]">ساخت لینک تولد موقتاً از پنل مدیر غیرفعال است.</div>}
              <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="personal-message" className="text-sm font-bold text-[#4c3d82]">یادداشت شخصی <span className="font-normal text-[#877bab]">(اختیاری)</span></Label><span className="text-xs text-[#877bab]">{personalMessage.length.toLocaleString(formatting)}/{PERSONAL_MESSAGE_MAX_LENGTH.toLocaleString(formatting)}</span></div><Textarea id="personal-message" dir={dir} ref={personalMessageTextarea.ref} value={personalMessage} maxLength={PERSONAL_MESSAGE_MAX_LENGTH} onChange={event => { setPersonalMessage(event.target.value); personalMessageTextarea.resize(event.currentTarget); }} placeholder={experience === "birthday" ? "یک تبریک کوتاه برای روز تولد." : "یک جمله‌ی کوتاه، فقط برای همان نفر."} className="min-h-24 max-h-40 resize-none rounded-xl border-[#d8d0ff] bg-white/80 px-4 leading-7 placeholder:text-[#a49bc8] focus-visible:ring-[#9560ff]" /></div>
              <div className="space-y-2"><div className="flex items-center justify-between"><Label className="text-sm font-bold text-[#4c3d82]">تصویر شخصی <span className="font-normal text-[#877bab]">(اختیاری)</span></Label>{premiumUnlocked ? <span className="text-xs font-bold text-[#6f45d2]">باز است</span> : <span className="text-xs font-bold text-[#7b709f]">قفل‌شده</span>}</div>{!premiumUnlocked && <div className="flex gap-2"><Input type="password" value={premiumPassword} onChange={event => setPremiumPassword(event.target.value)} placeholder="رمز قابلیت تصویر" className="h-11 rounded-xl border-[#d8d0ff]" /><Button type="button" onClick={() => unlockImage.mutate({ password: premiumPassword })} disabled={unlockImage.isPending || !premiumPassword} className="h-11 shrink-0 rounded-xl bg-[#8d5df1] px-4 font-bold">{unlockImage.isPending ? "در حال بررسی…" : "باز کردن"}</Button></div>}{premiumUnlocked && imagePreview ? <div className="relative h-36 overflow-hidden rounded-2xl border border-[#d8d0ff] bg-[#f4f0ff]"><img src={imagePreview} alt="پیش‌نمایش تصویر انتخاب‌شده" className="h-full w-full object-cover" /><button type="button" onClick={removeImage} className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#7450d9] shadow-sm" aria-label="حذف تصویر"><X className="h-4 w-4" /></button></div> : <label className="flex min-h-26 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#bcaaff] bg-[#f7f4ff]/80 px-4 text-center transition hover:bg-[#f0ebff]"><ImagePlus className="h-5 w-5 text-[#8758ef]" /><span className="mt-2 text-sm font-bold text-[#5b4698]">انتخاب تصویر از دستگاه</span><span className="mt-1 text-xs text-[#877bab]">JPG، PNG یا WebP تا ۱ مگابایت</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseImage} /></label>}</div>
              <div className="space-y-2"><Label htmlFor="expires-at" className="text-sm font-bold text-[#4c3d82]">تاریخ انقضا <span className="font-normal text-[#877bab]">(اختیاری)</span></Label><Input id="expires-at" type="datetime-local" value={expiresAt} min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} onChange={event => setExpiresAt(event.target.value)} className="h-12 rounded-xl border-[#d8d0ff] bg-white/80" /><p className="text-xs text-[#756b9d]">بعد از این زمان، لینک برای بازدیدکننده غیرفعال می‌شود.</p></div>
              {experience === "gift" && <><div><Label className="text-sm font-bold text-[#4c3d82]">رنگ متن‌ها</Label><div className="mt-3 flex gap-3">{GIFT_COLOR_META.map(option => <button type="button" key={option.value} onClick={() => setColor(option.value)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${color === option.value ? "border-[#8f5bf4] bg-[#f3efff]" : "border-[#dfd8ff] bg-white/70 hover:border-[#bda9ff]"}`}><span className="h-4 w-4 rounded-full shadow-[0_0_12px_currentColor]" style={{ backgroundColor: option.value, color: option.value }} />{option.label}</button>)}</div><p className="mt-3 text-sm font-bold" style={{ color }}>I LOVE YOU</p></div><div><Label className="text-sm font-bold text-[#4c3d82]">ظاهر لینک</Label><div className="mt-3 grid gap-3 sm:grid-cols-2">{THEMES.map(option => { const Icon = option.icon; const selected = theme === option.value; return <button type="button" onClick={() => setTheme(option.value)} key={option.value} className={`flex items-center gap-3 rounded-2xl border p-4 text-right transition ${selected ? "border-[#9b5cff] bg-[#f1ebff] shadow-[0_8px_20px_rgba(135,92,255,.14)]" : "border-[#ded8ff] bg-white/60 hover:border-[#bda9ff]"}`}><span className={`grid h-9 w-9 place-items-center rounded-xl ${option.value === "light" ? "bg-[#e0e7ff] text-[#516de5]" : "bg-[#eee2ff] text-[#8c51e8]"}`}><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-black text-[#45356f]">{option.title}</span><span className="mt-0.5 block text-xs text-[#776a9e]">{option.subtitle}</span></span>{selected && <Check className="mr-auto h-4 w-4 text-[#9358f5]" />}</button>; })}</div></div></>}
              <Button type="submit" disabled={isSubmitting || !name.trim() || (experience === "birthday" && (!birthdayEnabled || !isValidBirthdayAge(Number(birthdayAge)) || !selectedPreset))} className="h-13 w-full rounded-xl bg-[linear-gradient(100deg,#9460ff,#ed5ea7,#587aff)] text-base font-black shadow-[0_14px_28px_rgba(132,92,255,.28)] transition hover:brightness-105"><Link2 className="h-5 w-5" />{isSubmitting ? "در حال آماده‌سازی لینک…" : experience === "birthday" ? "ساخت لینک تولد" : "ساخت لینک شخصی"}{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}</Button>
              <p className="-mt-3 text-center text-[11px] leading-5 text-[#8276a8]">{PRIVACY_NOTICE}</p>
            </form>
            {gift && <div className="mt-6 rounded-2xl border border-[#dfd6ff] bg-[#f7f4ff] p-4"><p className="text-sm font-black text-[#7248d4]">لینکت آماده است</p><div className="mt-3 flex items-center gap-2"><div dir="ltr" className="min-w-0 flex-1 truncate rounded-xl border border-[#ded8ff] bg-white px-3 py-2.5 text-xs text-[#6670bd]">{giftUrl(gift.token)}</div><Button onClick={copyLink} size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-[#8d5df1] hover:bg-[#7247d5]" aria-label="کپی لینک"><Copy className="h-4 w-4" /></Button></div><a href={giftUrl(gift.token)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-bold text-[#7353d9] hover:underline">باز کردن لینک ←</a>{imageAttachmentStatus === "uploading" && <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[#7654dc]"><Loader2 className="h-3.5 w-3.5 animate-spin" />لینک آماده است؛ تصویر در پس‌زمینه افزوده می‌شود.</p>}{imageAttachmentStatus === "attached" && <p className="mt-3 text-xs font-bold text-[#3f8b6c]">تصویر با موفقیت به هدیه اضافه شد.</p>}{imageAttachmentStatus === "failed" && pendingImage && <button type="button" onClick={() => void attachImageInBackground(pendingImage.created, pendingImage.file)} className="mt-3 text-xs font-bold text-[#c14d79] underline underline-offset-4">افزودن تصویر ناموفق بود؛ دوباره تلاش کن</button>}</div>}
          </section>
        </div>

      </div>
    </main>
  );
}
