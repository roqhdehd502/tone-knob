import { createContext, useContext } from "react";

import type { Locale, MessageKey } from "~/i18n";
import { createT, DATE_LOCALE } from "~/i18n";

interface I18nContextValue {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  locale: Locale;
  dateLocale: string;
}

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
  locale: "ko",
  dateLocale: "ko-KR",
});

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value: I18nContextValue = {
    t: createT(locale),
    locale,
    dateLocale: DATE_LOCALE[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
