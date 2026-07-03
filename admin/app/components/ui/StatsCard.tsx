import type { LucideIcon } from "lucide-react";

import { cn } from "./cn";

interface Props {
  title: string;
  value: number | string;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string };
}

export function StatsCard({ title, value, sub, icon: Icon, iconColor = "text-blue-600", trend }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={cn("rounded-lg bg-slate-50 p-2.5", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-xs">
          <span className={cn("font-semibold", trend.value >= 0 ? "text-emerald-600" : "text-red-500")}>
            {trend.value >= 0 ? "+" : ""}
            {trend.value}
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
