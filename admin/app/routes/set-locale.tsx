import { redirect } from "react-router";

import type { Route } from "./+types/set-locale";

/**
 * 언어 전환 액션. 폼 `locale` 필드 값을 1년짜리 `locale` 쿠키로 저장하고
 * `Referer` 헤더가 가리키는 이전 페이지로 리다이렉트한다.
 * 유효하지 않은 로케일 값은 `"ko"`로 fallback된다.
 */
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const locale = form.get("locale") as string;
  const redirectTo = request.headers.get("Referer") ?? "/";

  const valid = locale === "ko" || locale === "en" ? locale : "ko";

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": `locale=${valid}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; HttpOnly`,
    },
  });
}

/** 직접 접근 시 아무것도 렌더링하지 않는 더미 컴포넌트 */
export default function SetLocale() {
  return null;
}
