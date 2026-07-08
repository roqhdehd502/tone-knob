import { NavLink } from "react-router";

import { FileMusic, Home, Radio, Search, Users } from "lucide-react";

import { useI18n } from "~/context/i18n";
import { cn } from "~/lib/utils";

export function MobileNav() {
  const { t } = useI18n();

  const navItems = [
    { to: "/", icon: Home, label: t("mobileNav.home") },
    { to: "/tabs", icon: Search, label: t("mobileNav.explore") },
    { to: "/editor", icon: FileMusic, label: t("mobileNav.editor") },
    { to: "/jamroom", icon: Radio, label: t("mobileNav.jam") },
    { to: "/community", icon: Users, label: t("mobileNav.community") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/60 bg-white/90 backdrop-blur-xl dark:border-gray-800/60 dark:bg-gray-950/90 lg:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-miami-600 dark:text-miami-400"
                  : "text-gray-400 dark:text-gray-500",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
