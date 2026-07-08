import { en } from "./locales/en";
import type { MessageKey } from "./locales/ko";
import { ko } from "./locales/ko";

export type { MessageKey };
export type Locale = "ko" | "en";

export const DATE_LOCALE: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
};

const MESSAGES: Record<Locale, typeof ko> = { ko, en };

export function getLocale(cookieHeader: string): Locale {
  const match = cookieHeader.match(/(?:^|;\s*)locale=([^;]+)/);
  const found = match?.[1];
  if (found === "ko" || found === "en") return found;
  return "ko";
}

export function createT(locale: Locale) {
  const messages = MESSAGES[locale];
  return function t(key: MessageKey, params?: Record<string, string | number>): string {
    let text: string = messages[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };
}
