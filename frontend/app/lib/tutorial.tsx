import { createContext, useCallback, useContext, useState } from "react";

const STORAGE_KEY = "tone-knob-tutorial-completed";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  href?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Tone Knob에 오신 걸 환영합니다!",
    description:
      "타브 제작부터 실시간 합주까지, 음악을 사랑하는 사람들을 위한 올인원 플랫폼입니다. 주요 기능을 간단히 소개해 드릴게요.",
    icon: "sparkles",
  },
  {
    id: "editor",
    title: "타브 에디터",
    description:
      "직관적인 에디터로 기타 타브를 제작하세요. 6줄 타브 캔버스에서 음표를 입력하고, 버전 관리와 공개/비공개 설정이 가능합니다.",
    icon: "file-music",
    href: "/editor/new",
  },
  {
    id: "tabs",
    title: "타브 탐색 & 커뮤니티",
    description:
      "다른 뮤지션들이 공유한 타브를 탐색하고, 마음에 드는 타브를 포크하거나 좋아요를 눌러보세요. 커뮤니티 피드에서 팔로우한 뮤지션의 최신 타브를 확인할 수 있습니다.",
    icon: "search",
    href: "/tabs",
  },
  {
    id: "jamroom",
    title: "실시간 합주방",
    description:
      "합주방을 만들어 친구들과 실시간으로 함께 연주하세요. WebRTC 기반의 저지연 오디오로 어디서나 합주를 즐길 수 있습니다.",
    icon: "radio",
    href: "/jamroom",
  },
  {
    id: "ai",
    title: "AI 기능",
    description:
      "AI 타브 자동 생성과 오디오에서 타브 추출 기능을 제공합니다. 텍스트 프롬프트나 오디오 파일로 빠르게 타브를 만들어보세요.",
    icon: "sparkles-ai",
    href: "/ai-generate",
  },
  {
    id: "practice",
    title: "연습 & 녹음",
    description:
      "연습 세션을 기록하고 통계를 확인하세요. 녹음 기능으로 연주를 저장하고, 대시보드에서 연습 패턴을 분석할 수 있습니다.",
    icon: "bar-chart",
    href: "/dashboard",
  },
];

interface TutorialContextValue {
  isCompleted: boolean;
  isOpen: boolean;
  currentStep: number;
  totalSteps: number;
  step: TutorialStep;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const completeTutorial = useCallback(() => {
    setIsOpen(false);
    setIsCompleted(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTutorial();
    }
  }, [currentStep, completeTutorial]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    completeTutorial();
  }, [completeTutorial]);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsCompleted(false);
    setCurrentStep(0);
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        isCompleted,
        isOpen,
        currentStep,
        totalSteps: TUTORIAL_STEPS.length,
        step: TUTORIAL_STEPS[currentStep],
        startTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        completeTutorial,
        resetTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
}
