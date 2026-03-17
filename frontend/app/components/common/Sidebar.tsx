import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import { Home, FileMusic, Radio, Users, Settings, Plus, Search, FolderOpen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListItem } from "~/types/tab";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { to: "/", icon: Home, label: "홈" },
  { to: "/tabs", icon: Search, label: "타브 탐색" },
  { to: "/tabs/my", icon: FolderOpen, label: "내 타브" },
  { to: "/editor", icon: FileMusic, label: "타브 에디터" },
  { to: "/jamroom", icon: Radio, label: "합주방" },
  { to: "/community", icon: Users, label: "커뮤니티" },
];

const bottomNavItems = [{ to: "/settings", icon: Settings, label: "설정" }];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const [recentTabs, setRecentTabs] = useState<TabListItem[]>([]);

  useEffect(() => {
    if (user) {
      api.tabs
        .my({ limit: 5 })
        .then((res) => setRecentTabs(res.data))
        .catch(() => {});
    } else {
      setRecentTabs([]);
    }
  }, [user]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed left-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] w-60 flex-col border-r border-gray-200/60 bg-white/95 backdrop-blur-sm transition-transform duration-200 dark:border-gray-800/60 dark:bg-gray-950/95",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <Button className="mb-4 w-full gap-2" asChild>
            <NavLink to="/editor/new">
              <Plus className="h-4 w-4" />새 타브 만들기
            </NavLink>
          </Button>

          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/" || item.to === "/tabs/my"}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Separator className="my-4" />

          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">
              최근 타브
            </p>
            {recentTabs.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {user ? "아직 타브가 없습니다" : "로그인해주세요"}
              </p>
            ) : (
              recentTabs.map((tab) => (
                <NavLink
                  key={tab.id}
                  to={`/tabs/${tab.id}`}
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                >
                  <FileMusic className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{tab.title}</span>
                </NavLink>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-gray-200/60 p-3 dark:border-gray-800/60">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
}
