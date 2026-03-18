import { Bell, BookOpen, Globe, Monitor, Moon, Shield, Sun } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { type Theme, useTheme } from "~/lib/theme";
import { useTutorial } from "~/lib/tutorial";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "설정 - Tone Knob" }, { name: "description", content: "설정" }];
}

const themeOptions: { value: Theme; icon: typeof Sun; label: string; desc: string }[] = [
  { value: "light", icon: Sun, label: "라이트", desc: "밝은 배경의 라이트 모드" },
  { value: "dark", icon: Moon, label: "다크", desc: "어두운 배경의 다크 모드" },
  { value: "system", icon: Monitor, label: "시스템", desc: "OS 설정을 따릅니다" },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { isCompleted, resetTutorial, startTutorial } = useTutorial();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">설정</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          앱 환경을 원하는 대로 설정하세요
        </p>
      </div>

      {/* 테마 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">화면 테마</CardTitle>
          <CardDescription>앱의 외관을 선택하세요</CardDescription>
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
                    ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/30"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    theme === opt.value
                      ? "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300"
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
                        ? "text-violet-700 dark:text-violet-300"
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

      {/* 알림 설정 (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">알림</CardTitle>
          <CardDescription>알림 수신 방법을 설정하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 p-4 dark:border-gray-800">
            <Bell className="h-5 w-5 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              알림 설정 기능이 곧 제공됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 튜토리얼 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">튜토리얼</CardTitle>
          <CardDescription>플랫폼 사용법을 다시 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">온보딩 튜토리얼</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isCompleted
                    ? "튜토리얼을 이미 완료했습니다"
                    : "튜토리얼을 아직 완료하지 않았습니다"}
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
              {isCompleted ? "다시 보기" : "시작하기"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 언어/개인정보 (placeholder) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">언어</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 p-3 dark:border-gray-800">
              <Globe className="h-4 w-4 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">한국어 (곧 다국어 지원)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">개인정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 p-3 dark:border-gray-800">
              <Shield className="h-4 w-4 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">개인정보 설정 준비 중</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
