import { Bell, BookOpen, Globe, Monitor, Moon, Shield, Sun } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useI18n } from "~/context/i18n";
import { type Theme, useTheme } from "~/lib/theme";
import { useTutorial } from "~/lib/tutorial";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Settings - Tone Knob" }, { name: "description", content: "App settings" }];
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { isCompleted, resetTutorial, startTutorial } = useTutorial();
  const { t, locale, setLocale } = useI18n();

  const themeOptions: { value: Theme; icon: typeof Sun; label: string; desc: string }[] = [
    {
      value: "light",
      icon: Sun,
      label: t("settings.theme.light"),
      desc: t("settings.theme.lightDesc"),
    },
    {
      value: "dark",
      icon: Moon,
      label: t("settings.theme.dark"),
      desc: t("settings.theme.darkDesc"),
    },
    {
      value: "system",
      icon: Monitor,
      label: t("settings.theme.system"),
      desc: t("settings.theme.systemDesc"),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("settings.heading")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("settings.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.themeTitle")}</CardTitle>
          <CardDescription>{t("settings.themeDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  theme === opt.value
                    ? "border-miami-500 bg-miami-50 dark:border-miami-400 dark:bg-miami-950/30"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    theme === opt.value
                      ? "bg-miami-100 text-miami-600 dark:bg-miami-900 dark:text-miami-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      theme === opt.value
                        ? "text-miami-700 dark:text-miami-300"
                        : "text-gray-900 dark:text-white",
                    )}
                  >
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.notificationTitle")}</CardTitle>
          <CardDescription>{t("settings.notificationDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 p-4 dark:border-gray-800">
            <Bell className="h-5 w-5 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("settings.notificationComingSoon")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.tutorialTitle")}</CardTitle>
          <CardDescription>{t("settings.tutorialDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-miami-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("settings.onboardingLabel")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isCompleted
                    ? t("settings.tutorialCompleted")
                    : t("settings.tutorialNotCompleted")}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isCompleted) resetTutorial();
                startTutorial();
              }}
            >
              {isCompleted ? t("settings.tutorialRestart") : t("settings.tutorialStart")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("settings.languageTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <Globe className="h-4 w-4 text-gray-400" />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setLocale("ko")}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    locale === "ko"
                      ? "bg-miami-100 text-miami-700 dark:bg-miami-900/40 dark:text-miami-300"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  )}
                >
                  {t("settings.langKo")}
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    locale === "en"
                      ? "bg-miami-100 text-miami-700 dark:bg-miami-900/40 dark:text-miami-300"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  )}
                >
                  {t("settings.langEn")}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("settings.privacyTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 p-3 dark:border-gray-800">
              <Shield className="h-4 w-4 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("settings.privacyComingSoon")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
