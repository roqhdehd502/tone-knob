import { Menu, User } from "lucide-react";

import { useSidebar } from "~/context/sidebar";

interface Props {
  adminName: string;
  adminEmail: string;
  title: string;
}

export function Topbar({ adminName, adminEmail, title }: Props) {
  const { toggle } = useSidebar();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="메뉴 열기"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
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
