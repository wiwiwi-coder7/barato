import { BIRTHDAY_LOCK_NOTICE } from "@/lib/birthday";
import { CakeSlice, LockKeyhole } from "lucide-react";
import React from "react";

export function BirthdayLockedCard({ isDarkTheme }: { isDarkTheme: boolean }) {
  return (
    <section aria-label="بخش تبریک تولد قفل‌شده" aria-disabled="true" className={`relative mt-10 overflow-hidden rounded-[1.7rem] border p-5 shadow-[0_18px_48px_rgba(112,91,215,.1)] sm:mt-14 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-7 ${isDarkTheme ? "border-white/15 bg-white/10" : "border-[#ded5ff] bg-white/75"}`}>
      <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[#ffb9e5]/45 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#9b5cff,#f05ba8,#5e7dff)] text-white shadow-[0_10px_24px_rgba(142,90,255,.24)]"><CakeSlice className="h-5 w-5" /></span>
        <div>
          <div className="flex items-center gap-2"><h2 className={isDarkTheme ? "text-lg font-black text-white" : "text-lg font-black text-[#423275]"}>تبریک تولد</h2><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${isDarkTheme ? "bg-white/15 text-[#ffe1f5]" : "bg-[#f1ebff] text-[#7b52d3]"}`}><LockKeyhole className="h-3 w-3" /> قفل‌شده</span></div>
          <p className={isDarkTheme ? "mt-2 text-sm leading-7 text-white/70" : "mt-2 text-sm leading-7 text-[#706393]"}>{BIRTHDAY_LOCK_NOTICE}</p>
        </div>
      </div>
      <span className={`relative mt-4 inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-bold sm:mt-0 sm:self-auto ${isDarkTheme ? "border-white/15 text-white/65" : "border-[#e3dcff] text-[#7d70a1]"}`}><LockKeyhole className="h-3.5 w-3.5" /> دسترسی محدود</span>
    </section>
  );
}
