import { Link } from "react-router";

import { FileMusic, Github, Radio, Users } from "lucide-react";

const footerLinks = [
  {
    title: "서비스",
    links: [
      { to: "/tabs", label: "타브 탐색", icon: FileMusic },
      { to: "/jamroom", label: "합주방", icon: Radio },
      { to: "/community", label: "커뮤니티", icon: Users },
    ],
  },
  {
    title: "더 보기",
    links: [
      { to: "/ai-generate", label: "AI 타브 생성" },
      { to: "/audio-extract", label: "오디오 추출" },
      { to: "/marketplace", label: "마켓플레이스" },
    ],
  },
  {
    title: "계정",
    links: [
      { to: "/profile", label: "프로필" },
      { to: "/settings", label: "설정" },
      { to: "/subscription", label: "구독" },
    ],
  },
  {
    title: "법적 고지",
    links: [
      { to: "/terms", label: "이용약관" },
      { to: "/privacy", label: "개인정보처리방침" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200/60 bg-white/50 backdrop-blur-sm dark:border-gray-800/60 dark:bg-gray-950/50 lg:pl-60">
      <div className="px-5 py-8 md:px-8 lg:px-10 xl:px-14">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">
          {/* 브랜드 */}
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/images/logo-48.png" alt="Tone Knob" className="h-7 w-7 rounded-lg" />
              <span className="text-sm font-bold">
                <span className="text-miami-500">tone</span>{" "}
                <span className="text-rosewood-600 dark:text-rosewood-400">knob</span>
              </span>
            </Link>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              타브 제작부터 실시간 온라인 합주까지, 음악을 만들고 함께 연주하세요.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* 링크 그룹 */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-miami-600 dark:text-gray-400 dark:hover:text-miami-400"
                    >
                      {"icon" in link && link.icon
                        ? (() => {
                            const Icon = link.icon;
                            return <Icon className="h-3 w-3" />;
                          })()
                        : null}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 하단 */}
        <div className="mt-8 border-t border-gray-200/60 pt-5 dark:border-gray-800/60">
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} Tone Knob. All rights reserved.
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              대표자: 나민우 | 이메일:{" "}
              <a
                href="mailto:mwna9409@gmail.com"
                className="underline hover:text-gray-600 dark:hover:text-gray-300"
              >
                mwna9409@gmail.com
              </a>
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
              <Link to="/terms" className="hover:text-gray-600 dark:hover:text-gray-300">
                이용약관
              </Link>
              <span>|</span>
              <Link to="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300">
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
