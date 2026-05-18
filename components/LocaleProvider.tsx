"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type Locale, type TranslationKey, translations } from "@/lib/i18n";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("invoice_locale") as Locale | null;
    if (saved === "fr" || saved === "ar") {
      setLocaleState(saved);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("invoice_locale", newLocale);
    document.documentElement.lang = newLocale === "ar" ? "ar" : "fr";
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale === "ar" ? "ar" : "fr";
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    }
  }, [locale, mounted]);

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key],
    [locale]
  );

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
