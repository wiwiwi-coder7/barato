import DashboardLayout from "@/components/DashboardLayout";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BIRTHDAY_ROUTE, birthdayImageUrl, type BirthdayContentRecord } from "@/lib/birthday";

function birthdayPublicUrl() {
  if (window.location.hostname.endsWith("github.io")) {
    const base = window.location.pathname.endsWith("/") ? window.location.pathname : `${window.location.pathname}/`;
    return `${window.location.origin}${base}#${BIRTHDAY_ROUTE}`;
  }
  return `${window.location.origin}${BIRTHDAY_ROUTE}`;
}
import { PERSONAL_MESSAGE_MAX_LENGTH, giftImageUrl, giftUrl, type GiftRecord, type GiftTheme } from "@/lib/gift";
import { fileToBase64, validateGiftImage } from "@/lib/imageUpload";
import { isAuthenticatedAdminSession } from "@/lib/adminSession";
import { DEFAULT_BIRTHDAY_PUBLIC_SETTINGS, type BirthdayCakePreset, type BirthdayPublicSettings } from "@/lib/publicBirthday";
import type { GiftLinkEvent } from "@/lib/standaloneApi";
import { trpc } from "@/lib/trpc";
import { DEFAULT_GIFT_COLOR, GIFT_COLOR_META, isApprovedGiftColor } from "@shared/colors";
import { Activity, BarChart3, CakeSlice, Copy, Eye, EyeOff, Heart, ImagePlus, KeyRound, LayoutDashboard, Link2, Loader2, MapPin, MonitorSmartphone, Pencil, Plus, ShieldCheck, SlidersHorizontal, Trash2, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

type EditingGift = Omit<Pick<GiftRecord, "id" | "name" | "message" | "personalMessage" | "imageKey" | "theme" | "expiresAt">, "color"> & {
  color: (typeof GIFT_COLOR_META)[number]["value"];
};
type BirthdayImageField = "catImageKey" | "cakeImageKey" | "motorImageKey";

const BIRTHDAY_IMAGE_FIELDS: { field: BirthdayImageField; label: string }[] = [
  { field: "catImageKey", label: "تصویر گربه" },
  { field: "cakeImageKey", label: "تصویر کیک" },
  { field: "motorImageKey", label: "تصویر موتور" },
];

export function formatGiftExpiration(expiresAt: Date | string | null | undefined, now = Date.now()) {
  if (!expiresAt) return "بدون انقضا";
  const timestamp = new Date(expiresAt).getTime();
  return timestamp <= now ? "منقضی‌شده" : `تا ${new Date(timestamp).toLocaleString("fa-IR")}`;
}

function copyText(value: string) {
  return navigator.clipboard.writeText(value).then(() => toast.success("لینک کپی شد."));
}
function eventTypeLabel(eventType: GiftLinkEvent["eventType"]) { return eventType === "created" ? "ساخت لینک" : "بازدید لینک"; }
function eventLocation(event: GiftLinkEvent) { return [event.city, event.region, event.country].filter(Boolean).join("، ") || "موقعیت تقریبی در دسترس نیست"; }

export default function AdminPage() {
  const { dir, formatting } = useLocale();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [adminSection, setAdminSection] = useState<"overview" | "links" | "birthday" | "security">("overview");
  const { data: session, isLoading: sessionLoading } = trpc.admin.session.useQuery(undefined, { staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: true });
  const authenticated = isAuthenticatedAdminSession(session);
  const [password, setPassword] = useState("");
  const [currentAdminPassword, setCurrentAdminPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [editing, setEditing] = useState<EditingGift | null>(null);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GiftRecord | null>(null);
  const [eventGift, setEventGift] = useState<GiftRecord | null>(null);
  const [birthdayDraft, setBirthdayDraft] = useState<BirthdayContentRecord | null>(null);
  const [birthdayImageFiles, setBirthdayImageFiles] = useState<Partial<Record<BirthdayImageField, File>>>({});
  const [birthdayImagePreviews, setBirthdayImagePreviews] = useState<Partial<Record<BirthdayImageField, string>>>({});
  const [birthdayPublicSettingsDraft, setBirthdayPublicSettingsDraft] = useState<BirthdayPublicSettings>(DEFAULT_BIRTHDAY_PUBLIC_SETTINGS);
  const [birthdayPresetDrafts, setBirthdayPresetDrafts] = useState<BirthdayCakePreset[]>([]);
  const [newCakeLabel, setNewCakeLabel] = useState("");
  const [newCakeHasBuiltinCandles, setNewCakeHasBuiltinCandles] = useState(false);
  const [newCakeSortOrder, setNewCakeSortOrder] = useState("0");
  const [newCakeFile, setNewCakeFile] = useState<File | null>(null);
  const [newCakePreview, setNewCakePreview] = useState<string | null>(null);

  const { data: gifts, isLoading: giftsLoading } = trpc.admin.list.useQuery(undefined, { enabled: authenticated });
  const { data: analytics } = trpc.admin.analytics.useQuery(undefined, { enabled: authenticated, refetchInterval: 15000 });
  const { data: eventPayload, isLoading: eventsLoading } = trpc.admin.linkEvents.useQuery({ giftId: eventGift?.id }, { enabled: authenticated && Boolean(eventGift) });
  const { data: birthdayData, isLoading: birthdayLoading } = trpc.admin.birthday.get.useQuery(undefined, { enabled: authenticated });
  const { data: birthdayPublicSettingsData, isLoading: birthdayPublicSettingsLoading } = trpc.admin.birthday.publicSettings.get.useQuery(undefined, { enabled: authenticated });
  const { data: birthdayPresetData, isLoading: birthdayPresetLoading } = trpc.admin.birthday.presets.list.useQuery(undefined, { enabled: authenticated });
  const login = trpc.admin.login.useMutation({
    onSuccess: async () => {
      setPassword("");
      await utils.admin.session.invalidate();
      await utils.admin.list.invalidate();
      toast.success("با موفقیت وارد شدی.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const logout = trpc.admin.logout.useMutation({
    onSuccess: async () => {
      await utils.admin.session.invalidate();
      toast.message("از پنل خارج شدی.");
    },
  });
  const changePassword = trpc.admin.changePassword.useMutation({
    onSuccess: async () => {
      setCurrentAdminPassword("");
      setNewAdminPassword("");
      setConfirmAdminPassword("");
      await utils.admin.session.invalidate();
      toast.success("رمز تغییر کرد؛ برای امنیت، همهٔ نشست‌ها بسته شدند.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateGift = trpc.admin.update.useMutation({
    onSuccess: async () => {
      setEditing(null);
      setEditingImageFile(null);
      setEditingImagePreview(null);
      await utils.admin.list.invalidate();
      toast.success("تغییرات ذخیره شد.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteGift = trpc.admin.delete.useMutation({
    onSuccess: async () => {
      setPendingDelete(null);
      await utils.admin.list.invalidate();
      toast.success("لینک حذف شد.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const uploadImage = trpc.gifts.uploadImage.useMutation();
  const updateBirthdayPublicSettings = trpc.admin.birthday.publicSettings.update.useMutation({ onSuccess: async (settings: BirthdayPublicSettings) => { setBirthdayPublicSettingsDraft(settings); await utils.admin.birthday.publicSettings.invalidate(); toast.success("تنظیمات تولد عمومی ذخیره شد."); }, onError: (error: Error) => toast.error(error.message) });
  const createBirthdayPreset = trpc.admin.birthday.presets.create.useMutation({ onSuccess: async () => { setNewCakeLabel(""); setNewCakeHasBuiltinCandles(false); setNewCakeSortOrder("0"); setNewCakeFile(null); setNewCakePreview(null); await utils.admin.birthday.presets.invalidate(); toast.success("کیک جدید به گالری اضافه شد."); }, onError: (error: Error) => toast.error(error.message) });
  const updateBirthdayPreset = trpc.admin.birthday.presets.update.useMutation({ onSuccess: async () => { await utils.admin.birthday.presets.invalidate(); toast.success("تنظیمات کیک ذخیره شد."); }, onError: (error: Error) => toast.error(error.message) });
  const deleteBirthdayPreset = trpc.admin.birthday.presets.delete.useMutation({ onSuccess: async () => { await utils.admin.birthday.presets.invalidate(); toast.success("کیک از گالری حذف شد."); }, onError: (error: Error) => toast.error(error.message) });
  const updateBirthday = trpc.admin.birthday.update.useMutation({
    onSuccess: async (content: BirthdayContentRecord) => {
      setBirthdayDraft(content as BirthdayContentRecord);
      setBirthdayImageFiles({});
      setBirthdayImagePreviews({});
      await utils.admin.birthday.get.invalidate();
      toast.success("محتوای تولد ذخیره شد.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const giftRows = useMemo(() => (gifts ?? []) as GiftRecord[], [gifts]);
  const linkEvents = (eventPayload?.events ?? []) as GiftLinkEvent[];

  useEffect(() => {
    if (birthdayData && !birthdayDraft) setBirthdayDraft(birthdayData as BirthdayContentRecord);
  }, [birthdayData, birthdayDraft]);
  useEffect(() => {
    if (birthdayPublicSettingsData) setBirthdayPublicSettingsDraft(birthdayPublicSettingsData as BirthdayPublicSettings);
  }, [birthdayPublicSettingsData]);
  useEffect(() => {
    if (birthdayPresetData) setBirthdayPresetDrafts(birthdayPresetData as BirthdayCakePreset[]);
  }, [birthdayPresetData]);

  const submitLogin = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ password });
  };
  const submitPasswordChange = (event: FormEvent) => {
    event.preventDefault();
    changePassword.mutate({ currentPassword: currentAdminPassword, newPassword: newAdminPassword, confirmPassword: confirmAdminPassword });
  };
  const submitBirthdayPublicSettings = (event: FormEvent) => {
    event.preventDefault();
    updateBirthdayPublicSettings.mutate({ ...birthdayPublicSettingsDraft, candlePrompt: birthdayPublicSettingsDraft.candlePrompt.trim(), backgroundColor: birthdayPublicSettingsDraft.backgroundColor.toUpperCase() });
  };

  const chooseEditingImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateGiftImage(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }
    setEditingImageFile(file);
    setEditingImagePreview(URL.createObjectURL(file));
  };

  const chooseBirthdayImage = (field: BirthdayImageField, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateGiftImage(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }
    setBirthdayImageFiles(previous => ({ ...previous, [field]: file }));
    setBirthdayImagePreviews(previous => ({ ...previous, [field]: URL.createObjectURL(file) }));
  };

  const chooseNewCakeImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateGiftImage(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }
    setNewCakeFile(file);
    setNewCakePreview(URL.createObjectURL(file));
  };

  const createCakePreset = async (event: FormEvent) => {
    event.preventDefault();
    if (!newCakeFile || !newCakeLabel.trim()) return;
    try {
      const upload = await uploadImage.mutateAsync({ mimeType: newCakeFile.type as "image/jpeg" | "image/png" | "image/webp", base64: await fileToBase64(newCakeFile) });
      await createBirthdayPreset.mutateAsync({ label: newCakeLabel.trim(), imageKey: upload.key, hasBuiltinCandles: newCakeHasBuiltinCandles, sortOrder: Number(newCakeSortOrder) || 0, isActive: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "بارگذاری کیک انجام نشد.");
    }
  };

  const saveCakePreset = (preset: BirthdayCakePreset) => {
    updateBirthdayPreset.mutate({ id: preset.id, label: preset.label.trim(), imageKey: preset.imageKey, hasBuiltinCandles: preset.hasBuiltinCandles, isActive: preset.isActive !== false, sortOrder: preset.sortOrder });
  };

  const submitBirthday = async (event: FormEvent) => {
    event.preventDefault();
    if (!birthdayDraft) return;
    try {
      const resolveImageKey = async (field: BirthdayImageField) => {
        const file = birthdayImageFiles[field];
        if (!file) return birthdayDraft[field];
        return (await uploadImage.mutateAsync({ mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64: await fileToBase64(file) })).key;
      };
      updateBirthday.mutate({
        catText: birthdayDraft.catText.trim(),
        cakeText: birthdayDraft.cakeText.trim(),
        motorText: birthdayDraft.motorText.trim(),
        catImageKey: await resolveImageKey("catImageKey"),
        cakeImageKey: await resolveImageKey("cakeImageKey"),
        motorImageKey: await resolveImageKey("motorImageKey"),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "بارگذاری تصویر انجام نشد.");
    }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      const imageKey = editingImageFile
        ? (await uploadImage.mutateAsync({
          mimeType: editingImageFile.type as "image/jpeg" | "image/png" | "image/webp",
          base64: await fileToBase64(editingImageFile),
        })).key
        : editing.imageKey;
      updateGift.mutate({ ...editing, personalMessage: editing.personalMessage?.trim() || null, imageKey });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "بارگذاری تصویر انجام نشد.");
    }
  };

  const openEditor = (gift: GiftRecord) => {
    setEditing({
      id: gift.id,
      name: gift.name,
      message: gift.message,
      personalMessage: gift.personalMessage,
      imageKey: gift.imageKey,
      color: isApprovedGiftColor(gift.color) ? gift.color : DEFAULT_GIFT_COLOR,
      theme: gift.theme,
      expiresAt: gift.expiresAt,
    });
    setEditingImageFile(null);
    setEditingImagePreview(null);
  };

  if (sessionLoading) return <main className="grid min-h-screen place-items-center" dir={dir}><Loader2 className="h-6 w-6 animate-spin text-[#8758ef]" /></main>;

  if (!authenticated) {
    return (
      <main dir={dir} className="grid min-h-screen place-items-center overflow-hidden bg-[#f7f4ff] px-5">
        <div className="absolute left-[-5rem] top-[-4rem] h-72 w-72 rounded-full bg-[#e1d7ff] blur-3xl" />
        <form onSubmit={submitLogin} className="relative w-full max-w-md rounded-[2rem] border border-[#e0d9ff] bg-white p-7 shadow-[0_24px_70px_rgba(100,78,188,.12)] sm:p-9">
          <div className="absolute left-5 top-5"><LanguageSwitcher compact /></div>
          <div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-[linear-gradient(135deg,#9560ff,#ec5fa9,#587aff)] text-white shadow-lg"><KeyRound className="h-6 w-6" /></div>
          <h1 className="text-3xl font-black text-[#403171]">پنل مدیریت</h1>
          <p className="mt-3 leading-7 text-[#746a99]">رمز اختصاصی مدیر را وارد کن تا لینک‌هایت را مدیریت کنی.</p>
          <div className="mt-7 space-y-2">
            <Label htmlFor="admin-password">رمز مدیریت</Label>
            <Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="h-12 rounded-xl border-[#ddd5ff]" placeholder="رمز را وارد کن" />
          </div>
          <Button type="submit" disabled={login.isPending || !password} className="mt-6 h-12 w-full rounded-xl bg-[linear-gradient(100deg,#9460ff,#ed5ea7,#587aff)] font-black hover:brightness-105">
            {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ورود به پنل
          </Button>
          <Link href="/" className="mt-5 block text-center text-sm font-bold text-[#7654dc] hover:underline">بازگشت به ساخت لینک</Link>
        </form>
      </main>
    );
  }

  return (
    <DashboardLayout onLogout={() => logout.mutate()}>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold text-[#7654dc]">فضای مدیریت</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#403171]">لینک‌های ساخته‌شده</h1>
          <p className="mt-2 text-sm leading-6 text-[#756b9d]">لینک‌ها را ببین، ویرایش کن یا در صورت نیاز حذف کن.</p>
        </div>
        <Button onClick={() => navigate("/")} className="h-11 rounded-xl bg-[linear-gradient(100deg,#9460ff,#ed5ea7,#587aff)] px-5 font-black hover:brightness-105"><Plus className="h-4 w-4" /> ساخت لینک تازه</Button>
      </header>

      <nav aria-label="بخش‌های پنل مدیریت" className="mt-8 grid gap-2 rounded-[1.5rem] border border-[#e4deff] bg-white/85 p-2 shadow-[0_14px_38px_rgba(100,78,188,.06)] sm:grid-cols-4">
        {[{ id: "overview", label: "نمای کلی", icon: LayoutDashboard }, { id: "links", label: "لینک‌ها و آمار", icon: BarChart3 }, { id: "birthday", label: "تولد", icon: CakeSlice }, { id: "security", label: "امنیت", icon: ShieldCheck }].map(item => { const Icon = item.icon; const active = adminSection === item.id; return <button key={item.id} type="button" onClick={() => setAdminSection(item.id as typeof adminSection)} className={`flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition ${active ? "bg-[linear-gradient(100deg,#9460ff,#ed5ea7,#587aff)] text-white shadow-[0_8px_18px_rgba(131,91,244,.22)]" : "text-[#6f6294] hover:bg-[#f3efff] hover:text-[#6845ca]"}`}><Icon className="h-4 w-4" /> {item.label}</button>; })}
      </nav>

      {adminSection === "overview" && <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.35rem] border border-[#e4deff] bg-white p-5 shadow-[0_15px_45px_rgba(100,78,188,.06)]"><p className="text-sm font-bold text-[#756b9d]">تعداد لینک‌ها</p><p className="mt-2 text-3xl font-black text-[#6f45d2]">{analytics?.totalLinks ?? 0}</p></div>
        <div className="rounded-[1.35rem] border border-[#e4deff] bg-white p-5 shadow-[0_15px_45px_rgba(100,78,188,.06)]"><p className="text-sm font-bold text-[#756b9d]">مجموع بازدیدها</p><p className="mt-2 text-3xl font-black text-[#e04e9a]">{analytics?.totalVisits ?? 0}</p></div>
        <div className="rounded-[1.35rem] border border-[#e4deff] bg-white p-5 shadow-[0_15px_45px_rgba(100,78,188,.06)]"><p className="text-sm font-bold text-[#756b9d]">آخرین به‌روزرسانی</p><p className="mt-2 text-lg font-black text-[#587aff]">هر ۱۵ ثانیه</p></div>
      </section>}

      {adminSection === "security" && <section className="mt-9 rounded-[1.75rem] border border-[#e4deff] bg-white p-5 shadow-[0_15px_45px_rgba(100,78,188,.08)] sm:p-7">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f1ecff] text-[#7651d3]"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-sm font-bold text-[#7654dc]">امنیت پنل</p><h2 className="mt-1 text-2xl font-black text-[#403171]">تغییر رمز مدیریت</h2><p className="mt-2 text-sm leading-6 text-[#756b9d]">رمز جدید باید دست‌کم ۱۲ کاراکتر داشته باشد. پس از ذخیره، همهٔ نشست‌های قبلی بسته می‌شوند.</p></div></div>
        <form onSubmit={submitPasswordChange} className="mt-6 grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label htmlFor="current-admin-password">رمز فعلی</Label><Input id="current-admin-password" type="password" autoComplete="current-password" value={currentAdminPassword} onChange={event => setCurrentAdminPassword(event.target.value)} className="h-11 rounded-xl border-[#ddd5ff]" /></div><div className="space-y-2"><Label htmlFor="new-admin-password">رمز جدید</Label><Input id="new-admin-password" type="password" autoComplete="new-password" value={newAdminPassword} onChange={event => setNewAdminPassword(event.target.value)} className="h-11 rounded-xl border-[#ddd5ff]" /></div><div className="space-y-2"><Label htmlFor="confirm-admin-password">تکرار رمز جدید</Label><Input id="confirm-admin-password" type="password" autoComplete="new-password" value={confirmAdminPassword} onChange={event => setConfirmAdminPassword(event.target.value)} className="h-11 rounded-xl border-[#ddd5ff]" /></div><div className="md:col-span-3"><Button type="submit" disabled={changePassword.isPending || !currentAdminPassword || !newAdminPassword || !confirmAdminPassword} className="h-11 rounded-xl bg-[#7651d3] px-5 font-black hover:bg-[#633ec2]">{changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ذخیرهٔ رمز جدید</Button></div></form>
      </section>}

      {adminSection === "birthday" && <><section className="mt-9 rounded-[1.75rem] border border-[#e4deff] bg-white p-5 shadow-[0_15px_45px_rgba(100,78,188,.08)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-[#7654dc]">تولد عمومی</p><h2 className="mt-1 text-2xl font-black text-[#403171]">تنظیمات تجربهٔ شمع</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#756b9d]">این تنظیمات روی لینک‌های تولد تازه اعمال می‌شود. خاموش‌کردن عرضه، فقط ساخت لینک جدید را متوقف می‌کند.</p></div><span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${birthdayPublicSettingsDraft.isEnabled ? "bg-[#eaf9f1] text-[#30795c]" : "bg-[#fff0f5] text-[#b44a72]"}`}>{birthdayPublicSettingsDraft.isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{birthdayPublicSettingsDraft.isEnabled ? "برای عموم فعال" : "برای عموم غیرفعال"}</span></div>
        {birthdayPublicSettingsLoading ? <div className="grid min-h-32 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#8758ef]" /></div> : <form onSubmit={submitBirthdayPublicSettings} className="mt-7 grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-[#e6e0ff] bg-[#faf9ff] p-4"><Label htmlFor="birthday-public-enabled" className="flex cursor-pointer items-center justify-between gap-4"><span><span className="block text-sm font-black text-[#4b397e]">فعال‌بودن ساخت تولد</span><span className="mt-1 block text-xs leading-5 text-[#7b709f]">کاربران عادی فقط در زمان فعال‌بودن، گزینهٔ تولد را می‌بینند.</span></span><input id="birthday-public-enabled" type="checkbox" checked={birthdayPublicSettingsDraft.isEnabled} onChange={event => setBirthdayPublicSettingsDraft({ ...birthdayPublicSettingsDraft, isEnabled: event.target.checked })} className="h-5 w-5 accent-[#8758ef]" /></Label></div><div className="space-y-2"><Label htmlFor="birthday-prompt">متن بالای شمع</Label><Input id="birthday-prompt" value={birthdayPublicSettingsDraft.candlePrompt} maxLength={120} onChange={event => setBirthdayPublicSettingsDraft({ ...birthdayPublicSettingsDraft, candlePrompt: event.target.value })} className="h-11 rounded-xl border-[#ddd5ff]" /></div><div className="space-y-2"><Label htmlFor="birthday-background">رنگ زمینهٔ تجربه</Label><div className="flex gap-3"><Input id="birthday-background" type="color" value={birthdayPublicSettingsDraft.backgroundColor} onChange={event => setBirthdayPublicSettingsDraft({ ...birthdayPublicSettingsDraft, backgroundColor: event.target.value.toUpperCase() })} className="h-11 w-16 cursor-pointer rounded-xl border-[#ddd5ff] p-1" /><Input value={birthdayPublicSettingsDraft.backgroundColor} maxLength={7} onChange={event => setBirthdayPublicSettingsDraft({ ...birthdayPublicSettingsDraft, backgroundColor: event.target.value.toUpperCase() })} className="h-11 flex-1 rounded-xl border-[#ddd5ff]" /></div></div><div className="flex items-end"><Button type="submit" disabled={updateBirthdayPublicSettings.isPending || !birthdayPublicSettingsDraft.candlePrompt.trim() || !/^#[0-9A-F]{6}$/.test(birthdayPublicSettingsDraft.backgroundColor)} className="h-11 rounded-xl bg-[#7651d3] px-6 font-black hover:bg-[#633ec2]">{updateBirthdayPublicSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ذخیرهٔ تنظیمات</Button></div></form>}

        <div className="mt-8 border-t border-[#eeeaff] pt-7"><div><p className="text-sm font-bold text-[#7654dc]">گالری کیک‌ها</p><h3 className="mt-1 text-xl font-black text-[#403171]">کیک‌های قابل انتخاب کاربران</h3></div>{birthdayPresetLoading ? <div className="grid min-h-32 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#8758ef]" /></div> : <div className="mt-5 grid gap-4 lg:grid-cols-2">{birthdayPresetDrafts.map((preset, index) => <article key={preset.id} className="grid gap-4 rounded-2xl border border-[#e5dfff] bg-[#fbfaff] p-4 sm:grid-cols-[7rem_1fr]"><img src={giftImageUrl(preset.imageKey) ?? ""} alt={preset.label} className="aspect-square w-full rounded-xl object-cover" /><div className="space-y-3"><Input value={preset.label} maxLength={100} onChange={event => setBirthdayPresetDrafts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} className="h-10 rounded-xl border-[#ddd5ff]" /><div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#6d618f]"><label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2"><input type="checkbox" checked={preset.hasBuiltinCandles} onChange={event => setBirthdayPresetDrafts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, hasBuiltinCandles: event.target.checked } : item))} className="accent-[#8758ef]" /> شمع داخلی دارد</label><label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2"><input type="checkbox" checked={preset.isActive !== false} onChange={event => setBirthdayPresetDrafts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: event.target.checked } : item))} className="accent-[#8758ef]" /> نمایش عمومی</label></div><div className="flex flex-wrap items-center gap-2"><Input type="number" min="0" max="999" value={preset.sortOrder} onChange={event => setBirthdayPresetDrafts(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, sortOrder: Number(event.target.value) || 0 } : item))} className="h-9 w-20 rounded-lg border-[#ddd5ff]" aria-label={`ترتیب ${preset.label}`} /><Button type="button" variant="outline" onClick={() => saveCakePreset(preset)} disabled={updateBirthdayPreset.isPending || !preset.label.trim()} className="h-9 rounded-lg border-[#ddd5ff] text-[#7251cf]">ذخیره</Button><Button type="button" variant="outline" onClick={() => deleteBirthdayPreset.mutate({ id: preset.id })} disabled={deleteBirthdayPreset.isPending} className="h-9 rounded-lg border-[#f1d7e7] text-[#bf3b70]">حذف</Button></div></div></article>)}</div>}</div>

        <form onSubmit={createCakePreset} className="mt-7 rounded-2xl border border-dashed border-[#cbbaff] bg-[#faf8ff] p-4"><div className="flex items-center gap-2 text-sm font-black text-[#5c4699]"><ImagePlus className="h-4 w-4" /> افزودن کیک جدید</div><div className="mt-4 grid gap-4 md:grid-cols-[1fr_9rem_9rem_auto]"><Input value={newCakeLabel} maxLength={100} onChange={event => setNewCakeLabel(event.target.value)} placeholder="نام کیک" className="h-11 rounded-xl border-[#ddd5ff]" /><Input type="number" min="0" max="999" value={newCakeSortOrder} onChange={event => setNewCakeSortOrder(event.target.value)} className="h-11 rounded-xl border-[#ddd5ff]" aria-label="ترتیب کیک" /><label className="flex h-11 items-center gap-2 rounded-xl border border-[#ddd5ff] bg-white px-3 text-xs font-bold text-[#6d618f]"><input type="checkbox" checked={newCakeHasBuiltinCandles} onChange={event => setNewCakeHasBuiltinCandles(event.target.checked)} className="accent-[#8758ef]" /> شمع داخلی</label><label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#cbbaff] bg-white px-4 text-sm font-black text-[#7251cf]"><ImagePlus className="h-4 w-4" /> تصویر<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseNewCakeImage} /></label></div>{newCakePreview && <img src={newCakePreview} alt="پیش‌نمایش کیک جدید" className="mt-4 h-32 rounded-xl object-cover" />}<Button type="submit" disabled={createBirthdayPreset.isPending || uploadImage.isPending || !newCakeFile || !newCakeLabel.trim()} className="mt-4 h-10 rounded-xl bg-[#7651d3] px-5 font-black hover:bg-[#633ec2]">{(createBirthdayPreset.isPending || uploadImage.isPending) && <Loader2 className="h-4 w-4 animate-spin" />} افزودن به گالری</Button></form>
      </section>

      <section className="mt-9 rounded-[1.75rem] border border-[#e4deff] bg-white p-5 shadow-[0_15px_45px_rgba(100,78,188,.08)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-[#7654dc]">مسیر اختصاصی آدین</p><h2 className="mt-1 text-2xl font-black text-[#403171]">محتوای تولد آدین</h2><p className="mt-2 text-sm leading-6 text-[#756b9d]">متن‌ها و عکس‌های سه مرحله را اینجا تغییر بده. ترتیب گربه، کیک و موتور ثابت می‌ماند.</p></div><div className="flex flex-wrap items-center gap-2"><span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f2edff] px-3 py-2 text-xs font-black text-[#7248d4]"><CakeSlice className="h-4 w-4" /> قابل‌ویرایش</span><Button type="button" variant="outline" onClick={() => window.open(birthdayPublicUrl(), "_blank", "noopener,noreferrer")} className="h-10 rounded-xl border-[#e2dbff] text-[#7251cf]"><CakeSlice className="h-4 w-4" /> مشاهده و تست</Button><Button type="button" variant="outline" onClick={() => copyText(birthdayPublicUrl())} className="h-10 rounded-xl border-[#e2dbff] text-[#7251cf]"><Copy className="h-4 w-4" /> کپی لینک تولد</Button></div></div>
        {birthdayLoading || !birthdayDraft ? <div className="grid min-h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#8758ef]" /></div> : <form onSubmit={submitBirthday} className="mt-7 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="birthday-cat-text">متن زیر گربه</Label><Input id="birthday-cat-text" value={birthdayDraft.catText} maxLength={160} onChange={event => setBirthdayDraft({ ...birthdayDraft, catText: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="birthday-cake-text">متن زیر کیک</Label><Input id="birthday-cake-text" value={birthdayDraft.cakeText} maxLength={160} onChange={event => setBirthdayDraft({ ...birthdayDraft, cakeText: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="birthday-motor-text">متن بخش موتور</Label><Input id="birthday-motor-text" value={birthdayDraft.motorText} maxLength={160} onChange={event => setBirthdayDraft({ ...birthdayDraft, motorText: event.target.value })} /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">{BIRTHDAY_IMAGE_FIELDS.map(({ field, label }) => { const imageUrl = birthdayImagePreviews[field] ?? birthdayImageUrl(birthdayDraft[field]); return <div key={field} className="space-y-2"><Label>{label}</Label>{imageUrl ? <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#e2dcff] bg-[#f7f4ff]"><img src={imageUrl} alt={`پیش‌نمایش ${label}`} className="h-full w-full object-cover" /><div className="absolute left-2 top-2 flex gap-2"><label className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/90 text-[#7450d9]" aria-label={`جایگزینی ${label}`}><ImagePlus className="h-4 w-4" /><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => chooseBirthdayImage(field, event)} /></label><button type="button" onClick={() => { setBirthdayDraft({ ...birthdayDraft, [field]: null }); setBirthdayImageFiles(previous => ({ ...previous, [field]: undefined })); setBirthdayImagePreviews(previous => ({ ...previous, [field]: undefined })); }} className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#b94370]" aria-label={`حذف ${label}`}><X className="h-4 w-4" /></button></div></div> : <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#bcaaff] bg-[#f7f4ff] text-center"><ImagePlus className="h-5 w-5 text-[#8758ef]" /><span className="mt-1 text-sm font-bold text-[#5b4698]">انتخاب {label}</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => chooseBirthdayImage(field, event)} /></label>}</div>; })}</div>
          <Button type="submit" disabled={updateBirthday.isPending || uploadImage.isPending || !birthdayDraft.catText.trim() || !birthdayDraft.cakeText.trim() || !birthdayDraft.motorText.trim()} className="h-11 rounded-xl bg-[linear-gradient(100deg,#9460ff,#ed5ea7,#587aff)] px-6 font-black hover:brightness-105">{(updateBirthday.isPending || uploadImage.isPending) && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره‌ی محتوای تولد</Button>
        </form>}
      </section></>}

      {adminSection === "links" && <section className="mt-9 rounded-[1.75rem] border border-[#e4deff] bg-white shadow-[0_15px_45px_rgba(100,78,188,.08)]">
        {giftsLoading ? <div className="grid min-h-56 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#8758ef]" /></div> : giftRows.length === 0 ? (
          <div className="grid min-h-64 place-items-center px-6 text-center"><div><Heart className="mx-auto h-8 w-8 fill-[#e5ddff] text-[#895bed]" /><p className="mt-4 font-black text-[#4b397e]">هنوز لینکی ساخته نشده است.</p><p className="mt-2 text-sm text-[#7b709f]">اولین لینک شخصی‌ات را بساز.</p></div></div>
        ) : (
          <div className="divide-y divide-[#eeeaff]">
            {giftRows.map(gift => (
              <article key={gift.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex min-w-0 items-center gap-4">
                  {gift.imageKey ? <img src={giftImageUrl(gift.imageKey) ?? ""} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-[#e4dcff]" /> : null}
                  <span className="h-11 w-2 shrink-0 rounded-full" style={{ backgroundColor: gift.color }} />
                  <div className="min-w-0"><h2 className="truncate text-lg font-black text-[#4b397e]">{gift.name} {gift.message}</h2><p className="mt-1 text-xs text-[#7b709f]">تم {gift.theme === "dark" ? "بنفش" : "روشن"} · {new Date(gift.createdAt).toLocaleDateString(formatting)} · {analytics?.perGift.find((item: { giftId: number; visits: number }) => item.giftId === gift.id)?.visits ?? 0} بازدید · {formatGiftExpiration(gift.expiresAt)}</p>{gift.personalMessage && <p className="mt-1 truncate text-xs text-[#9a83bd]">{gift.personalMessage}</p>}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setEventGift(gift)} className="h-9 w-9 rounded-lg border-[#e2dbff] text-[#7251cf]" aria-label={`جزئیات فنی لینک ${gift.name}`} title="جزئیات فنی لینک"><Activity className="h-4 w-4" /></Button>
                  <Button variant="outline" onClick={() => copyText(giftUrl(gift.token))} className="h-9 rounded-lg border-[#e2dbff] text-[#7251cf]"><Copy className="h-3.5 w-3.5" /> کپی</Button>
                  <Button variant="outline" onClick={() => openEditor(gift)} className="h-9 rounded-lg border-[#e2dbff] text-[#7251cf]"><Pencil className="h-3.5 w-3.5" /> ویرایش</Button>
                  <Button variant="outline" onClick={() => setPendingDelete(gift)} className="h-9 rounded-lg border-[#f1d7e7] text-[#bf3b70] hover:bg-[#fff2f8] hover:text-[#a52c5a]"><Trash2 className="h-3.5 w-3.5" /> حذف</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>}

      <Dialog open={Boolean(editing)} onOpenChange={open => { if (!open) { setEditing(null); setEditingImageFile(null); setEditingImagePreview(null); } }}>
        <DialogContent dir={dir} className="max-w-lg rounded-[1.5rem]">
          <DialogHeader><DialogTitle className="text-right text-xl font-black">ویرایش لینک</DialogTitle><DialogDescription className="text-right">تغییرات فقط روی همین لینک اعمال می‌شود.</DialogDescription></DialogHeader>
          {editing && <form onSubmit={submitEdit} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="edit-name">نام</Label><Input id="edit-name" value={editing.name} maxLength={80} onChange={event => setEditing({ ...editing, name: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="edit-message">متن بعد از نام</Label><Input id="edit-message" value={editing.message} maxLength={160} onChange={event => setEditing({ ...editing, message: event.target.value })} /></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="edit-personal-message">یادداشت شخصی</Label><span className="text-xs text-muted-foreground">{(editing.personalMessage?.length ?? 0).toLocaleString(formatting)}/{PERSONAL_MESSAGE_MAX_LENGTH.toLocaleString(formatting)}</span></div><Textarea id="edit-personal-message" dir={dir} value={editing.personalMessage ?? ""} maxLength={PERSONAL_MESSAGE_MAX_LENGTH} onChange={event => setEditing({ ...editing, personalMessage: event.target.value || null })} className="min-h-22 resize-none" placeholder="یادداشت شخصی اختیاری" /></div>
            <div className="space-y-2"><Label>تصویر شخصی</Label>{(editingImagePreview || giftImageUrl(editing.imageKey)) ? <div className="relative h-32 overflow-hidden rounded-2xl border bg-[#f5f2ff]"><img src={editingImagePreview ?? giftImageUrl(editing.imageKey) ?? ""} alt="پیش‌نمایش تصویر" className="h-full w-full object-cover" /><div className="absolute left-2 top-2 flex gap-2"><label className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/90 text-[#7450d9]" aria-label="جایگزینی تصویر"><ImagePlus className="h-4 w-4" /><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseEditingImage} /></label><button type="button" onClick={() => { setEditing({ ...editing, imageKey: null }); setEditingImageFile(null); setEditingImagePreview(null); }} className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#b94370]" aria-label="حذف تصویر"><X className="h-4 w-4" /></button></div></div> : <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#bcaaff] bg-[#f7f4ff] text-center"><ImagePlus className="h-5 w-5 text-[#8758ef]" /><span className="mt-1 text-sm font-bold text-[#5b4698]">انتخاب تصویر جدید</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseEditingImage} /></label>}</div>
            <div className="space-y-2"><Label htmlFor="edit-expires-at">تاریخ انقضا</Label><Input id="edit-expires-at" type="datetime-local" value={editing.expiresAt ? new Date(editing.expiresAt).toISOString().slice(0, 16) : ""} min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} onChange={event => setEditing({ ...editing, expiresAt: event.target.value ? new Date(event.target.value) : null })} /><p className="text-xs text-muted-foreground">خالی بگذارید تا لینک بدون انقضا بماند.</p></div>
            <div className="space-y-2"><Label>رنگ متن‌ها</Label><div className="grid grid-cols-3 gap-2">{GIFT_COLOR_META.map(option => <button type="button" key={option.value} onClick={() => setEditing({ ...editing, color: option.value })} className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-bold ${editing.color === option.value ? "border-[#9560ff] bg-[#f2edff]" : "border-[#e2dcff] bg-white"}`}><span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: option.value }} />{option.label}</button>)}</div></div>
            <div className="space-y-2"><Label>ظاهر لینک</Label><div className="grid grid-cols-2 gap-3">{(["light", "dark"] as GiftTheme[]).map(theme => <button type="button" key={theme} onClick={() => setEditing({ ...editing, theme })} className={`rounded-xl border p-3 text-sm font-bold ${editing.theme === theme ? "border-[#9560ff] bg-[#f1ebff] text-[#6845cb]" : "border-[#e2dcff] text-[#71648f]"}`}>{theme === "light" ? "روشن و لطیف" : "بنفش و رویایی"}</button>)}</div></div>
            <Button type="submit" disabled={updateGift.isPending || uploadImage.isPending || !editing.name.trim() || !editing.message.trim()} className="h-11 w-full rounded-xl bg-[linear-gradient(100deg,#9460ff,#ed5ea7,#587aff)] font-black hover:brightness-105">{(updateGift.isPending || uploadImage.isPending) && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره‌ی تغییرات</Button>
          </form>}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(eventGift)} onOpenChange={open => !open && setEventGift(null)}>
        <DialogContent dir={dir} className="max-h-[86vh] max-w-2xl overflow-y-auto rounded-[1.5rem]">
          <DialogHeader><DialogTitle className="flex items-center justify-end gap-2 text-right text-xl font-black"><Activity className="h-5 w-5 text-[#7654dc]" /> جزئیات فنی لینک</DialogTitle><DialogDescription className="text-right leading-7">این اطلاعات فقط برای مدیریت لینک نمایش داده می‌شود و رخدادهای قدیمی پس از ۳۰ روز حذف می‌شوند.</DialogDescription></DialogHeader>
          <div className="rounded-2xl border border-[#e6e0ff] bg-[#faf9ff] p-4"><p className="text-xs font-bold text-[#7a6ea0]">لینک منتخب</p><p className="mt-1 text-base font-black text-[#4c3a80]">{eventGift?.name} {eventGift?.message}</p></div>
          {eventsLoading ? <div className="grid min-h-44 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#8758ef]" /></div> : linkEvents.length === 0 ? <div className="rounded-2xl border border-dashed border-[#dcd2ff] p-8 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-[#8b64e8]" /><p className="mt-3 font-black text-[#4b397e]">هنوز رخدادی ثبت نشده است</p><p className="mt-2 text-sm leading-6 text-[#7b709f]">رخدادها فقط از زمان فعال‌شدن این قابلیت ثبت می‌شوند.</p></div> : <div className="space-y-3">{linkEvents.map(event => <article key={event.id} className="rounded-2xl border border-[#e5dfff] bg-white p-4 shadow-[0_8px_24px_rgba(100,78,188,.05)]"><div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ${event.eventType === "created" ? "bg-[#efeaff] text-[#7150d1]" : "bg-[#fff0f6] text-[#be4778]"}`}>{eventTypeLabel(event.eventType)}</span><time className="text-xs font-bold text-[#8478aa]">{new Date(event.createdAt).toLocaleString("fa-IR")}</time></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f8f6ff] p-3"><p className="text-xs font-bold text-[#8a7eae]">IP</p><p dir="ltr" className="mt-1 text-sm font-black text-[#4a3a79]">{event.ipAddress ?? "در دسترس نیست"}</p></div><div className="rounded-xl bg-[#f8f6ff] p-3"><p className="flex items-center gap-1 text-xs font-bold text-[#8a7eae]"><MapPin className="h-3.5 w-3.5" /> موقعیت تقریبی</p><p className="mt-1 text-sm font-black text-[#4a3a79]">{eventLocation(event)}</p></div><div className="rounded-xl bg-[#f8f6ff] p-3 sm:col-span-2"><p className="flex items-center gap-1 text-xs font-bold text-[#8a7eae]"><MonitorSmartphone className="h-3.5 w-3.5" /> دستگاه و مرورگر</p><p className="mt-1 text-sm font-black text-[#4a3a79]">{[event.device, event.browser, event.operatingSystem].filter(Boolean).join(" · ") || "در دسترس نیست"}</p></div></div></article>)}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={open => !open && setPendingDelete(null)}>
        <DialogContent dir={dir} className="max-w-md rounded-[1.5rem]"><DialogHeader><DialogTitle className="text-right text-xl font-black">حذف لینک</DialogTitle><DialogDescription className="text-right leading-7">آیا مطمئنی که می‌خواهی لینک «{pendingDelete?.name}» را حذف کنی؟ این عمل قابل بازگشت نیست.</DialogDescription></DialogHeader><div className="mt-2 flex gap-3"><Button variant="outline" onClick={() => setPendingDelete(null)} className="flex-1 rounded-xl">انصراف</Button><Button variant="destructive" onClick={() => pendingDelete && deleteGift.mutate({ id: pendingDelete.id, confirm: true })} disabled={deleteGift.isPending} className="flex-1 rounded-xl">{deleteGift.isPending && <Loader2 className="h-4 w-4 animate-spin" />} حذف قطعی</Button></div></DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
