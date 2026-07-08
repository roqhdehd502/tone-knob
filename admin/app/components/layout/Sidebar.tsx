import { NavLink } from "react-router";

import {
  Award,
  Bot,
  Coins,
  CreditCard,
  Headphones,
  LayoutDashboard,
  Music,
  Receipt,
  ShoppingCart,
  Users,
  Video,
  Wallet,
} from "lucide-react";

import { useI18n } from "~/context/i18n";
import { useSidebar } from "~/context/sidebar";

import { cn } from "../ui/cn";

export function Sidebar() {
  const { isOpen, close } = useSidebar();
  const { t } = useI18n();

  const navItems = [
    { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/users", label: t("nav.users"), icon: Users },
    { to: "/tabs", label: t("nav.tabs"), icon: Music },
    { to: "/jam-rooms", label: t("nav.jamRooms"), icon: Headphones },
    { to: "/subscriptions", label: t("nav.subscriptions"), icon: CreditCard },
    { to: "/recordings", label: t("nav.recordings"), icon: Video },
    { to: "/payments", label: t("nav.payments"), icon: Wallet },
    { to: "/settlements", label: t("nav.settlements"), icon: Receipt },
    { to: "/ai-jobs", label: t("nav.aiJobs"), icon: Bot },
    { to: "/badges", label: t("nav.badges"), icon: Award },
    { to: "/knob", label: t("nav.knob"), icon: Coins },
    { to: "/purchases", label: t("nav.purchases"), icon: ShoppingCart },
  ];

  return (
    <>
      {/* Mobile/Tablet backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-60 flex-col bg-slate-950 text-white transition-transform duration-200 ease-in-out",
          "lg:relative lg:z-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Music className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Tone Knob</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Admin
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={close}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-3">
          <form method="post" action="/logout">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
            >
              {t("nav.logout")}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
