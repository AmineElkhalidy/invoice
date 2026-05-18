"use client";

import { useLocale } from "@/components/LocaleProvider";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLocale(locale === "fr" ? "ar" : "fr")}
      className="font-semibold text-xs tracking-wide border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white transition-all duration-200"
      id="language-toggle"
    >
      {t("switchLang")}
    </Button>
  );
}
