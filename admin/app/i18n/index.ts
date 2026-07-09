import { en } from "./locales/en";
import type { MessageKey, Messages } from "./locales/ko";
import { ko } from "./locales/ko";

export type { MessageKey };

/** 지원 UI 언어 */
export type Locale = "ko" | "en";

/**
 * 로케일별 `Intl` BCP 47 언어 태그.
 * `date-fns`, `Intl.DateTimeFormat` 등에서 사용한다.
 */
export const DATE_LOCALE: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
};

/** 로케일별 번역 메시지 맵 */
const MESSAGES: Record<Locale, Messages> = { ko, en };

/**
 * HTTP Cookie 헤더에서 `locale` 값을 파싱하여 {@link Locale}을 반환한다.
 * 쿠키에 유효한 값이 없으면 기본값 `"ko"`를 반환한다.
 *
 * @param cookieHeader - `request.headers.get("Cookie")` 값
 * @returns 파싱된 로케일 (`"ko"` 또는 `"en"`)
 */
export function getLocale(cookieHeader: string): Locale {
  const match = cookieHeader.match(/(?:^|;\s*)locale=([^;]+)/);
  const found = match?.[1];
  if (found === "ko" || found === "en") return found;
  return "ko";
}

/**
 * 지정 로케일의 번역 함수를 생성하여 반환한다.
 * 반환된 함수는 메시지 키와 선택적 파라미터를 받아 치환된 번역 문자열을 돌려준다.
 * 키가 존재하지 않으면 키 자체를 그대로 반환한다.
 *
 * @param locale - 번역에 사용할 로케일
 * @returns `(key, params?) => string` 형태의 번역 함수
 *
 * @example
 * const t = createT("ko");
 * t("common.save");              // "저장"
 * t("users.count", { n: 5 });   // "사용자 5명"
 */
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
