import { useLocale } from "@/contexts/LocaleContext";
import { APP_LOCALES, LOCALE_META, type AppLocale } from "@/lib/locale";
import { Globe2 } from "lucide-react";
import React from "react";

type LanguageSwitcherProps = { compact?: boolean; className?: string };

export function LanguageSwitcher({ compact = false, className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, text } = useLocale();
  return <label className={`inline-flex h-10 items-center gap-2 rounded-xl border border-[#ded6ff] bg-white/80 px-3 text-sm font-black text-[#6747c6] shadow-sm backdrop-blur transition hover:border-[#bba7f5] ${className}`}>
    <Globe2 className="h-4 w-4" aria-hidden="true" />
    {!compact && <span className="sr-only">{text("زبان سایت")}</span>}
    <select aria-label={text("زبان سایت")} value={locale} onChange={event => setLocale(event.target.value as AppLocale)} className="min-w-0 bg-transparent text-inherit outline-none">
      {APP_LOCALES.map(item => <option key={item} value={item}>{LOCALE_META[item].nativeLabel}</option>)}
    </select>
  </label>;
}
