import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fileToBase64, validateGiftImage } from "@/lib/imageUpload";
import { giftImageUrl } from "@/lib/gift";
import type { ErikaBirthdayContent, ErikaLetter } from "@/lib/standaloneApi";
import { trpc } from "@/lib/trpc";
import { ImagePlus, Loader2, Music2, Save } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type MediaSlot = "heroImageKey" | "finalLetterImageKey" | "musicKey";
const mediaUrl = (key: string) => key.startsWith("/") ? key : giftImageUrl(key) ?? "";

function chooseFile(event: ChangeEvent<HTMLInputElement>, accept: string, onFile: (file: File) => void) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (accept.startsWith("image") && validateGiftImage(file)) { toast.error(validateGiftImage(file)!); event.target.value = ""; return; }
  onFile(file);
}

function ErikaMediaPicker({ label, value, preview, accept, onFile }: { label: string; value: string; preview?: string; accept: string; onFile: (file: File) => void }) {
  return <div className="space-y-2"><Label>{label}</Label>{accept.startsWith("image") ? <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#e2dcff] bg-[#f7f4ff]"><img src={preview ?? mediaUrl(value)} alt={label} className="h-full w-full object-contain" /><label className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1 rounded-xl bg-white/95 px-3 py-2 text-xs font-black text-[#704dcc] shadow"><ImagePlus className="h-4 w-4" /> تغییر<input type="file" accept={accept} className="sr-only" onChange={event => chooseFile(event, accept, onFile)} /></label></div> : <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#bcaaff] bg-[#f7f4ff] text-center text-sm font-black text-[#5b4698]"><Music2 className="h-6 w-6 text-[#8758ef]" /><span>{value.split("/").pop() || "انتخاب موسیقی"}</span><input type="file" accept={accept} className="sr-only" onChange={event => chooseFile(event, accept, onFile)} /></label>}</div>;
}

export default function ErikaBirthdayEditor() {
  const { data, isLoading } = trpc.admin.birthday.erika.get.useQuery(undefined, { enabled: true });
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<ErikaBirthdayContent | null>(null);
  const [files, setFiles] = useState<Partial<Record<MediaSlot | `letter-${number}`, File>>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const upload = trpc.admin.birthday.erika.upload.useMutation();
  const update = trpc.admin.birthday.erika.update.useMutation({ onSuccess: async (content: ErikaBirthdayContent) => { setDraft(content); setFiles({}); setPreviews({}); await utils.admin.birthday.erika.get.invalidate(); toast.success("محتوای تولد اریکا ذخیره شد."); }, onError: (error: Error) => toast.error(error.message) });

  useEffect(() => { if (data) setDraft(data as ErikaBirthdayContent); }, [data]);
  const setFile = (slot: MediaSlot | `letter-${number}`, file: File) => { setFiles(previous => ({ ...previous, [slot]: file })); setPreviews(previous => ({ ...previous, [slot]: URL.createObjectURL(file) })); };
  const patchLetter = (index: number, patch: Partial<ErikaLetter>) => setDraft(current => current ? { ...current, letters: current.letters.map((letter, itemIndex) => itemIndex === index ? { ...letter, ...patch } : letter) } : current);
  const uploadSlot = async (slot: MediaSlot | `letter-${number}`, fallback: string) => { const file = files[slot]; if (!file) return fallback; const result = await upload.mutateAsync({ mimeType: file.type, base64: await fileToBase64(file) }); return result.key; };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    try {
      const heroImageKey = await uploadSlot("heroImageKey", draft.heroImageKey);
      const finalLetterImageKey = await uploadSlot("finalLetterImageKey", draft.finalLetterImageKey);
      const musicKey = await uploadSlot("musicKey", draft.musicKey);
      const letters = await Promise.all(draft.letters.map(async (letter, index) => ({ ...letter, image: await uploadSlot(`letter-${index}`, letter.image) })));
      update.mutate({ heroImageKey, finalLetterImageKey, musicKey, letters });
    } catch (error) { toast.error(error instanceof Error ? error.message : "بارگذاری فایل انجام نشد."); }
  };

  if (isLoading || !draft) return <section className="mt-9 grid min-h-48 place-items-center rounded-[1.75rem] border border-[#e4deff] bg-white"><Loader2 className="h-6 w-6 animate-spin text-[#8758ef]" /></section>;
  return <section className="mt-9 rounded-[1.75rem] border border-[#e4deff] bg-white p-5 shadow-[0_15px_45px_rgba(100,78,188,.08)] sm:p-7">
    <div><p className="text-sm font-bold text-[#7654dc]">لینک اختصاصی اریکا</p><h2 className="mt-1 text-2xl font-black text-[#403171]">ویرایش نامه‌ها و رسانه‌های تولد</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#756b9d]">متن، نام، عنوان، رنگ، تصویر هر شخصیت، بنر، نامه‌ی نهایی و موسیقی را تغییر بده. تغییرات بعد از ذخیره روی لینک <span dir="ltr">#/birthday-erika</span> اعمال می‌شوند.</p></div>
    <form onSubmit={submit} className="mt-7 space-y-8">
      <div className="grid gap-5 md:grid-cols-3"><ErikaMediaPicker label="بنر ERIKA" value={draft.heroImageKey} preview={previews.heroImageKey} accept="image/jpeg,image/png,image/webp" onFile={file => setFile("heroImageKey", file)} /><ErikaMediaPicker label="نامه‌ی تصویری نهایی" value={draft.finalLetterImageKey} preview={previews.finalLetterImageKey} accept="image/jpeg,image/png,image/webp" onFile={file => setFile("finalLetterImageKey", file)} /><ErikaMediaPicker label="موسیقی پس‌زمینه" value={draft.musicKey} accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg" onFile={file => setFile("musicKey", file)} /></div>
      <div className="space-y-5">{draft.letters.map((letter, index) => <article key={`${letter.name}-${index}`} className="grid gap-5 rounded-2xl border border-[#e5dfff] bg-[#fbfaff] p-4 lg:grid-cols-[13rem_1fr]"><div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#f1edff]"><img src={previews[`letter-${index}`] ?? mediaUrl(letter.image)} alt={letter.name} className="h-full w-full object-contain" /><label className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1 rounded-xl bg-white/95 px-3 py-2 text-xs font-black text-[#704dcc] shadow"><ImagePlus className="h-4 w-4" /> تغییر<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => chooseFile(event, "image/jpeg,image/png,image/webp", file => setFile(`letter-${index}`, file))} /></label></div><div className="grid gap-3"><div className="grid gap-3 sm:grid-cols-2"><Input value={letter.name} maxLength={100} placeholder="نام انگلیسی" onChange={event => patchLetter(index, { name: event.target.value })} /><Input value={letter.role} maxLength={160} placeholder="عنوان فارسی" onChange={event => patchLetter(index, { role: event.target.value })} /></div><div className="flex items-center gap-3"><Input type="color" value={letter.accent} onChange={event => patchLetter(index, { accent: event.target.value })} className="h-10 w-14 cursor-pointer p-1" /><span className="text-xs font-bold text-[#7b709f]">رنگ کارت شخصیت</span></div><Textarea value={letter.message} maxLength={3000} rows={5} placeholder="متن نامه شخصیت" onChange={event => patchLetter(index, { message: event.target.value })} className="leading-7" /></div></article>)}</div>
      <Button type="submit" disabled={update.isPending || upload.isPending} className="h-11 rounded-xl bg-[linear-gradient(100deg,#9460ff,#ed5ea7,#587aff)] px-6 font-black hover:brightness-105">{update.isPending || upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره‌ی تغییرات اریکا</Button>
    </form>
  </section>;
}
