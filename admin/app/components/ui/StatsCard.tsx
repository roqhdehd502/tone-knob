import type { LucideIcon } from "lucide-react";

import { cn } from "./cn";

/** {@link StatsCard} 컴포넌트 props */
interface Props {
  /** 카드 상단 레이블 */
  title: string;
  /** 표시할 수치 또는 문자열 */
  value: number | string;
  /** 수치 아래에 표시할 보조 설명 (선택) */
  sub?: string;
  /** 우측 상단에 렌더링할 Lucide 아이콘 */
  icon: LucideIcon;
  /** 아이콘 컨테이너에 적용할 색상 Tailwind 클래스 (기본값: `"text-blue-600"`) */
  iconColor?: string;
  /** 증감 추세 정보 (선택) */
  trend?: {
    /** 증감 수치 (양수=증가, 음수=감소) */
    value: number;
    /** 추세 기간 레이블 (e.g. `"7일 신규"`) */
    label: string;
  };
}

/**
 * 대시보드에 주요 지표를 카드 형태로 표시하는 컴포넌트.
 * `trend`가 제공되면 카드 하단에 증감 색상 표시를 추가한다.
 *
 * @param props - {@link Props}
 */
export function StatsCard({
  title,
  value,
  sub,
  icon: Icon,
  iconColor = "text-blue-600",
  trend,
}: Props) {
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
          <span
            className={cn("font-semibold", trend.value >= 0 ? "text-emerald-600" : "text-red-500")}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
