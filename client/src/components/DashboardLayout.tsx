import { Home, Link2, LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/contexts/LocaleContext";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

type DashboardLayoutProps = {
  children: ReactNode;
  onLogout: () => void;
};

export default function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { dir } = useLocale();

  return (
    <div className="min-h-screen bg-[#f7f4ff] text-[#373070]" dir={dir}>
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col lg:flex-row">
        <aside className="relative overflow-hidden border-b border-[#e1dbff] bg-white px-5 py-6 lg:w-72 lg:border-b-0 lg:border-l lg:px-6">
          <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-[#e3d8ff] blur-3xl" />
          <div className="relative flex items-center justify-between lg:block">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#9560ff,#ed5fa8,#587aff)] text-white shadow-[0_12px_26px_rgba(123,88,229,.25)]">
                <Link2 className="h-5 w-5" />
              </div>
              <p className="text-lg font-black">برای تو</p>
              <p className="mt-1 text-sm text-[#756b9d]">مدیریت لینک‌های شخصی</p>
            </div>
            <div className="flex items-center gap-2"><LanguageSwitcher compact /><button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e1dbff] px-3 py-2 text-sm font-bold text-[#7550cd] transition hover:border-[#9b5cff] hover:bg-[#f5f1ff] lg:hidden"
            >
              <LogOut className="h-4 w-4" /> خروج
            </button></div>
          </div>

          <nav className="relative mt-7 flex gap-2 lg:flex-col" aria-label="ناوبری مدیریت">
            <Link
              href="/admin"
              className={`inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                location === "/admin" ? "bg-[#f3efff] text-[#6f45d2]" : "text-[#746a9a] hover:bg-[#f7f4ff]"
              }`}
            >
              <Link2 className="h-4 w-4" /> لینک‌ها
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[#746a9a] transition hover:bg-[#f7f4ff]"
            >
              <Home className="h-4 w-4" /> ساخت لینک
            </Link>
          </nav>

          <button
            type="button"
            onClick={onLogout}
            className="absolute bottom-6 hidden items-center gap-2 text-sm font-bold text-[#7550cd] transition hover:text-[#5632b8] lg:inline-flex"
          >
            <LogOut className="h-4 w-4" /> خروج از پنل
          </button>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
