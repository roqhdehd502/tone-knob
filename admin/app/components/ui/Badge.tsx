import { cn } from "./cn";

/** 뱃지에 적용 가능한 시각적 변형 */
type Variant = "default" | "success" | "warning" | "danger" | "info";

/** 변형별 Tailwind 클래스 매핑 */
const variants: Record<Variant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
};

/** {@link Badge} 컴포넌트 props */
interface Props {
  /** 뱃지 내부 콘텐츠 */
  children: React.ReactNode;
  /** 시각적 변형 (기본값: `"default"`) */
  variant?: Variant;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

/**
 * 상태·역할·카테고리 등을 표시하는 인라인 뱃지 컴포넌트.
 * `variant` prop으로 색상 테마를 결정한다.
 *
 * @param props - {@link Props}
 */
export function Badge({ children, variant = "default", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
