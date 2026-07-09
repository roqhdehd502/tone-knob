import { Outlet } from "react-router";

import { SidebarProvider } from "~/context/sidebar";

import { Sidebar } from "./Sidebar";

/**
 * 어드민 전역 레이아웃 컴포넌트.
 * `SidebarProvider`로 사이드바 상태를 제공하며, 왼쪽 {@link Sidebar}와
 * 오른쪽 `<Outlet>`(라우트별 페이지 콘텐츠)을 나란히 배치한다.
 *
 * React Router `app/routes.ts`에서 레이아웃 래퍼로 등록된다.
 */
export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
