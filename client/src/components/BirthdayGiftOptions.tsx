import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { giftImageUrl } from "@/lib/gift";
import type { BirthdayCakePreset, GiftExperience } from "@/lib/publicBirthday";
import { CakeSlice, Heart } from "lucide-react";

type BirthdayGiftOptionsProps = {
  experience: GiftExperience;
  onExperienceChange: (value: GiftExperience) => void;
  age: string;
  onAgeChange: (value: string) => void;
  presets: BirthdayCakePreset[];
  selectedPresetId: number | null;
  onPresetChange: (id: number) => void;
  isLoading: boolean;
};

export function BirthdayGiftOptions({ experience, onExperienceChange, age, onAgeChange, presets, selectedPresetId, onPresetChange, isLoading }: BirthdayGiftOptionsProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#e5ddff] bg-[#fbf9ff] p-4">
      <div><Label className="text-sm font-bold text-[#4c3d82]">نوع لینک</Label><div className="mt-3 grid grid-cols-2 gap-3"><button type="button" onClick={() => onExperienceChange("gift")} className={`rounded-xl border p-3 text-right transition ${experience === "gift" ? "border-[#8f5bf4] bg-[#f2edff]" : "border-[#dfd8ff] bg-white hover:border-[#bda9ff]"}`}><Heart className="h-4 w-4 text-[#e45b9d]" /><span className="mt-2 block text-sm font-black text-[#4b397e]">هدیهٔ معمولی</span></button><button type="button" onClick={() => onExperienceChange("birthday")} className={`rounded-xl border p-3 text-right transition ${experience === "birthday" ? "border-[#8f5bf4] bg-[#f2edff]" : "border-[#dfd8ff] bg-white hover:border-[#bda9ff]"}`}><CakeSlice className="h-4 w-4 text-[#8758ef]" /><span className="mt-2 block text-sm font-black text-[#4b397e]">تولد</span></button></div></div>
      {experience === "birthday" && <div className="space-y-4 border-t border-[#e7e0ff] pt-4"><div className="space-y-2"><Label htmlFor="birthday-age" className="text-sm font-bold text-[#4c3d82]">سن جدید</Label><Input id="birthday-age" type="number" inputMode="numeric" min="0" max="99" value={age} onChange={event => onAgeChange(event.target.value)} placeholder="مثلاً ۱۷" className="h-11 rounded-xl border-[#d8d0ff] bg-white" /><p className="text-xs leading-5 text-[#7c70a5]">برای کیک‌های بدون شمع، رقم‌های سن به‌صورت شمع روی کیک می‌آیند.</p></div><div className="space-y-2"><Label className="text-sm font-bold text-[#4c3d82]">کیک مورد نظر</Label>{isLoading ? <div className="grid h-32 place-items-center rounded-xl border border-dashed border-[#d8d0ff] text-xs text-[#8478a7]">در حال آماده‌سازی کیک‌ها…</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{presets.map(preset => <button type="button" key={preset.id} onClick={() => onPresetChange(preset.id)} className={`overflow-hidden rounded-xl border text-right transition ${selectedPresetId === preset.id ? "border-[#8f5bf4] bg-[#f1ecff] ring-2 ring-[#ae8df6]/35" : "border-[#e0d9ff] bg-white hover:border-[#bda9ff]"}`}><img src={giftImageUrl(preset.imageKey) ?? ""} alt={preset.label} className="aspect-square w-full object-cover" /><span className="block px-2 py-2 text-xs font-black text-[#59468f]">{preset.label}</span>{preset.hasBuiltinCandles && <span className="block px-2 pb-2 text-[10px] font-bold text-[#b05986]">شمع داخلی دارد</span>}</button>)}</div>}</div></div>}
    </section>
  );
}
