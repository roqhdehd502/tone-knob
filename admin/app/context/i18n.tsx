import { createContext, useContext } from "react";

import type { Locale, MessageKey } from "~/i18n";
import { createT, DATE_LOCALE } from "~/i18n";

/** React Context를 통해 공유되는 i18n 값 */
interface I18nContextValue {
  /** 번역 함수: 키와 선택적 파라미터를 받아 현재 로케일의 문자열을 반환한다 */
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  /** 현재 UI 언어 */
  locale: Locale;
  /** `Intl` API에 사용할 BCP 47 로케일 문자열 (e.g. `"ko-KR"`) */
  dateLocale: string;
}

/** 기본값: 키를 그대로 반환하고 로케일은 한국어로 초기화 */
const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
  locale: "ko",
  dateLocale: "ko-KR",
});

/**
 * 하위 트리에 번역 기능을 제공하는 Provider.
 * React Router의 root loader에서 감지한 `locale`을 주입받아 번역 함수를 생성한다.
 *
 * @param locale - 현재 UI 언어
 * @param children - 하위 React 트리
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value: I18nContextValue = {
    t: createT(locale),
    locale,
    dateLocale: DATE_LOCALE[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * 현재 로케일의 번역 함수와 로케일 정보를 반환하는 훅.
 * 반드시 {@link I18nProvider} 하위에서 사용해야 한다.
 *
 * @returns `{ t, locale, dateLocale }`
 */
export function useI18n() {
  return useContext(I18nContext);
}
