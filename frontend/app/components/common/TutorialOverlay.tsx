import { useEffect } from "react";
import { useNavigate } from "react-router";

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileMusic,
  Radio,
  Rocket,
  Search,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { useI18n } from "~/context/i18n";
import { useAuth } from "~/lib/auth";
import { TUTORIAL_STEPS, useTutorial } from "~/lib/tutorial";
import { cn } from "~/lib/utils";

const STEP_ICONS: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-8 w-8 text-miami-400" />,
  "file-music": <FileMusic className="h-8 w-8 text-miami-400" />,
  search: <Search className="h-8 w-8 text-cyan-400" />,
  radio: <Radio className="h-8 w-8 text-emerald-400" />,
  "sparkles-ai": <Wand2 className="h-8 w-8 text-amber-400" />,
  "bar-chart": <BarChart3 className="h-8 w-8 text-pink-400" />,
};

const STEP_COLORS: string[] = [
  "from-miami-600 to-miami-600",
  "from-miami-600 to-blue-600",
  "from-cyan-600 to-teal-600",
  "from-emerald-600 to-green-600",
  "from-amber-600 to-orange-600",
  "from-pink-600 to-rose-600",
];

export function TutorialOverlay() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    isCompleted,
    isOpen,
    currentStep,
    totalSteps,
    step,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
  } = useTutorial();

  useEffect(() => {
    if (user && !isCompleted && !isOpen) {
      startTutorial();
    }
  }, [user, isCompleted, isOpen, startTutorial]);

  if (!isOpen || !step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const gradientClass = STEP_COLORS[currentStep % STEP_COLORS.length];

  const handleNext = () => {
    if (isLast && step.href) {
      navigate(step.href);
    }
    nextStep();
  };

  const handleGoTo = () => {
    if (step.href) {
      navigate(step.href);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="relative mx-4 w-full max-w-lg overflow-hidden border-0 shadow-2xl">
        {/* Gradient banner */}
        <div className={cn("relative h-32 bg-linear-to-r", gradientClass)}>
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-3xl" />

          {/* Close button */}
          <button
            type="button"
            onClick={skipTutorial}
            className="absolute right-3 top-3 cursor-pointer rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
            aria-label={t("tutorial.close")}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-gray-900 shadow-lg dark:border-gray-900 dark:bg-gray-800">
              {STEP_ICONS[step.icon] || <Sparkles className="h-8 w-8 text-miami-400" />}
            </div>
          </div>
        </div>

        <CardContent className="px-6 pb-6 pt-12 text-center">
          {/* Step indicator */}
          <div className="mb-4 flex items-center justify-center gap-1.5">
            {TUTORIAL_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === currentStep
                    ? "w-6 bg-miami-500"
                    : idx < currentStep
                      ? "w-1.5 bg-miami-300 dark:bg-miami-700"
                      : "w-1.5 bg-gray-200 dark:bg-gray-700",
                )}
              />
            ))}
          </div>

          {/* Content — step.title/description are defined in tutorial.tsx (not localized) */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{step.title}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {step.description}
          </p>

          {/* Action link */}
          {step.href && !isLast && (
            <button
              type="button"
              onClick={handleGoTo}
              className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-miami-600 hover:underline dark:text-miami-400"
            >
              {t("tutorial.shortcut")}
            </button>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={isFirst}
              className={cn("gap-1", isFirst && "invisible")}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("tutorial.prev")}
            </Button>

            <span className="text-xs text-gray-400">
              {currentStep + 1} / {totalSteps}
            </span>

            {isLast ? (
              <Button size="sm" onClick={handleNext} className="gap-1.5">
                <Rocket className="h-3.5 w-3.5" />
                {t("tutorial.start")}
              </Button>
            ) : (
              <Button size="sm" onClick={handleNext} className="gap-1">
                {t("tutorial.next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              type="button"
              onClick={skipTutorial}
              className="mt-3 cursor-pointer text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {t("tutorial.skip")}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
