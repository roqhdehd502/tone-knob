import { useEffect, useState } from "react";
import { NavLink } from "react-router";

import {
  AudioLines,
  FileMusic,
  FolderOpen,
  Home,
  Mic,
  Plus,
  Radio,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import { cn } from "~/lib/utils";
import type { TabListItem } from "~/types/tab";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [recentTabs, setRecentTabs] = useState<TabListItem[]>([]);

  const mainNavItems = [
    { to: "/", icon: Home, label: t("nav.home") },
    { to: "/tabs", icon: Search, label: t("nav.tabs") },
    { to: "/tabs/my", icon: FolderOpen, label: t("nav.myTabs") },
    { to: "/editor", icon: FileMusic, label: t("nav.editor") },
    { to: "/jamroom", icon: Radio, label: t("nav.jamroom") },
    { to: "/community", icon: Users, label: t("nav.community") },
  ];

  const toolNavItems = [
    { to: "/ai-generate", icon: Wand2, label: t("nav.aiGenerate") },
    { to: "/audio-extract", icon: AudioLines, label: t("nav.audioExtract") },
    { to: "/recordings", icon: Mic, label: t("nav.recordings") },
  ];

  const moreNavItems = [
    { to: "/marketplace", icon: ShoppingBag, label: t("nav.marketplace") },
    { to: "/subscription", icon: Sparkles, label: t("nav.subscription") },
  ];

  const bottomNavItems = [{ to: "/settings", icon: Settings, label: t("nav.settings") }];

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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label={t("nav.sidebarLabel")}
        className={cn(
          "fixed left-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] w-60 flex-col border-r border-gray-200/60 bg-white/95 backdrop-blur-sm transition-transform duration-200 dark:border-gray-800/60 dark:bg-gray-950/95",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <Button className="mb-4 w-full gap-2" asChild>
            <NavLink to="/editor/new">
              <Plus className="h-4 w-4" />
              {t("nav.newTab")}
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
                      ? "bg-miami-50 text-miami-700 dark:bg-miami-950 dark:text-miami-300"
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
              {t("nav.tools")}
            </p>
            {toolNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-miami-50 text-miami-700 dark:bg-miami-950 dark:text-miami-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">
              {t("nav.more")}
            </p>
            {moreNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-miami-50 text-miami-700 dark:bg-miami-950 dark:text-miami-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">
              {t("nav.recentTabs")}
            </p>
            {recentTabs.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {user ? t("nav.recentTabsEmpty") : t("nav.loginPrompt")}
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
                    ? "bg-miami-50 text-miami-700 dark:bg-miami-950 dark:text-miami-300"
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
