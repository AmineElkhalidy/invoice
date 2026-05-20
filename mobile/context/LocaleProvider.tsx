import React, { createContext, useContext, useState, useCallback } from "react";
import { I18nManager } from "react-native";
import { translations, type Locale, type TranslationKey } from "../lib/i18n";

interface LocaleContextType {
  locale: Locale;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "fr",
  toggleLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("fr");

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next = prev === "fr" ? "ar" : "fr";
      I18nManager.forceRTL(next === "ar");
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key],
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, toggleLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
