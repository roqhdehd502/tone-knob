import { useState } from "react";
import { isRouteErrorResponse, Outlet } from "react-router";

import { ErrorFallback } from "~/components/common/ErrorFallback";
import { captureException } from "~/lib/sentry";

import type { Route } from "./+types/MainLayout";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TutorialOverlay } from "./TutorialOverlay";

function MainLayoutShell({
  sidebarOpen,
  setSidebarOpen,
  children,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 lg:pl-60">
        <div className="animate-fade-in px-5 py-6 pb-20 md:px-8 lg:px-10 lg:pb-6 xl:px-14">
          {children}
        </div>
      </main>
      <Footer />
      <MobileNav />
      <TutorialOverlay />
    </div>
  );
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <MainLayoutShell sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <Outlet />
    </MainLayoutShell>
  );
}

// 페이지 단위 오류가 전체 앱(헤더/사이드바/네비게이션)까지 무너뜨리지 않도록
// 레이아웃 레벨에서 한 번 더 잡아 본문 영역만 대체한다.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  let title = "문제가 발생했습니다";
  let description = "이 페이지를 표시하는 중 오류가 발생했습니다.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "페이지를 찾을 수 없습니다" : `오류 ${error.status}`;
    description =
      error.status === 404
        ? "요청하신 페이지가 존재하지 않거나 이동되었습니다."
        : error.statusText || description;
  } else if (error instanceof Error) {
    captureException(error);
    if (import.meta.env.DEV) {
      description = error.message;
      stack = error.stack;
    }
  }

  return (
    <MainLayoutShell sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <ErrorFallback title={title} description={description} stack={stack} />
    </MainLayoutShell>
  );
}
