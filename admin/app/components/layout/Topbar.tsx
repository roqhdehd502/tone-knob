import { useRouteLoaderData } from "react-router";

import { Menu, User } from "lucide-react";

import { useI18n } from "~/context/i18n";
import { useSidebar } from "~/context/sidebar";
import type { Locale } from "~/i18n";

/** {@link Topbar} 컴포넌트 props */
interface Props {
  /** 상단 우측에 표시할 어드민 이름 */
  adminName: string;
  /** 상단 우측에 표시할 어드민 이메일 */
  adminEmail: string;
  /** 페이지 제목 (h1) */
  title: string;
}

/**
 * 어드민 패널 상단 헤더 바.
 *
 * - 모바일 환경에서 햄버거 아이콘으로 사이드바를 토글한다.
 * - 언어 전환 버튼(`KO` / `EN`)이 `POST /set-locale`로 쿠키를 설정한다.
 * - 현재 로케일은 root loader 데이터에서 우선 읽고, 없으면 i18n 컨텍스트 값을 사용한다.
 *
 * @param props - {@link Props}
 */
export function Topbar({ adminName, adminEmail, title }: Props) {
  const { toggle } = useSidebar();
  const { t, locale } = useI18n();
  const rootData = useRouteLoaderData<{ locale: Locale }>("root");
  const currentLocale = rootData?.locale ?? locale;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={t("common.menuOpen")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Language switcher */}
        <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs font-semibold">
          {(["ko", "en"] as const).map((lng) => (
            <form key={lng} method="post" action="/set-locale">
              <input type="hidden" name="locale" value={lng} />
              <button
                type="submit"
                className={`px-2.5 py-1.5 transition-colors ${
                  currentLocale === lng
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {lng.toUpperCase()}
              </button>
            </form>
          ))}
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{adminName}</p>
          <p className="text-xs text-slate-500">{adminEmail}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
