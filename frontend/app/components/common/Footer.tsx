import { Link } from "react-router";

import { FileMusic, Github, Radio, Users } from "lucide-react";

import { useI18n } from "~/context/i18n";

export function Footer() {
  const { t } = useI18n();

  const footerLinks = [
    {
      title: t("footer.service"),
      links: [
        { to: "/tabs", label: t("nav.tabs"), icon: FileMusic },
        { to: "/jamroom", label: t("nav.jamroom"), icon: Radio },
        { to: "/community", label: t("nav.community"), icon: Users },
      ],
    },
    {
      title: t("footer.more"),
      links: [
        { to: "/ai-generate", label: t("nav.aiGenerate") },
        { to: "/audio-extract", label: t("nav.audioExtract") },
        { to: "/marketplace", label: t("nav.marketplace") },
      ],
    },
    {
      title: t("footer.account"),
      links: [
        { to: "/profile", label: t("nav.profile") },
        { to: "/settings", label: t("nav.settings") },
        { to: "/subscription", label: t("nav.subscription") },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { to: "/terms", label: t("footer.terms") },
        { to: "/privacy", label: t("footer.privacy") },
      ],
    },
  ];

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
              {t("footer.tagline")}
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
              {t("footer.representative")} |{" "}
              <a
                href="mailto:mwna9409@gmail.com"
                className="underline hover:text-gray-600 dark:hover:text-gray-300"
              >
                mwna9409@gmail.com
              </a>
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
              <Link to="/terms" className="hover:text-gray-600 dark:hover:text-gray-300">
                {t("footer.terms")}
              </Link>
              <span>|</span>
              <Link to="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300">
                {t("footer.privacy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
