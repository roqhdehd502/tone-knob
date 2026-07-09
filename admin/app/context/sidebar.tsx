import { createContext, useContext, useState } from "react";

/** React Context를 통해 공유되는 사이드바 상태 및 제어 함수 */
type SidebarContextType = {
  /** 사이드바 열림 여부 */
  isOpen: boolean;
  /** 사이드바 열림/닫힘 토글 */
  toggle: () => void;
  /** 사이드바 강제 닫기 (모바일 네비게이션 클릭 후 호출) */
  close: () => void;
};

/** 기본값: 닫힌 상태, 빈 핸들러 */
const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

/**
 * 사이드바 열림 상태를 관리하는 Provider.
 * 모바일 환경에서 오버레이 제어에 사용된다.
 *
 * @param children - 하위 React 트리
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggle: () => setIsOpen((o) => !o),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * 사이드바 열림 상태와 제어 함수를 반환하는 훅.
 * 반드시 {@link SidebarProvider} 하위에서 사용해야 한다.
 *
 * @returns `{ isOpen, toggle, close }`
 */
export function useSidebar() {
  return useContext(SidebarContext);
}
