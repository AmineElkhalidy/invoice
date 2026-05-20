"use client";

import { useLocale } from "@/components/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { logoutClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { stationConfig } from "@/config/station";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Header() {
  const { t } = useLocale();
  const router = useRouter();

  const handleLogout = () => {
    logoutClient();
    router.push("/login");
  };

  return (
    <header className="print:hidden sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-white"
              aria-hidden="true"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h6" />
              <path d="M14 3h4a2 2 0 0 1 2 2v2" />
              <path d="M21 14v3a2 2 0 0 1-2 2h-4" />
              <path d="M10 21H5a2 2 0 0 1-2-2v-4" />
              <path d="M8 10h8v4H8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              {stationConfig.name}
            </h1>
            <p className="text-[11px] text-slate-400">{t("appTitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-all">
            {t("dashboardTitle") || "Dashboard"}
          </Link>
          <Link href="/clients" className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-all">
            {t("clientsTitle")}
          </Link>
          <div className="w-px h-4 bg-white/20 mx-1"></div>
          <LanguageToggle />
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            id="logout-button"
          >
            {t("logout")}
          </Button>
        </div>
      </nav>
    </header>
  );
}
