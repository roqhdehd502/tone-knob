import { createContext, useContext, useState } from "react";

import type { Locale, MessageKey } from "~/i18n";
import { createT, DATE_LOCALE } from "~/i18n";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

interface I18nContextValue {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  locale: Locale;
  dateLocale: string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
  locale: "ko",
  dateLocale: "ko-KR",
  setLocale: () => {},
});

export function I18nProvider({
  locale: initialLocale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem("locale");
    if (stored === "ko" || stored === "en") return stored;
    return initialLocale;
  });

  const setLocale = (newLocale: Locale) => {
    document.cookie = `locale=${newLocale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
    localStorage.setItem("locale", newLocale);
    setLocaleState(newLocale);
  };

  const value: I18nContextValue = {
    t: createT(locale),
    locale,
    dateLocale: DATE_LOCALE[locale],
    setLocale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
