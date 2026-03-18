// SVG 음표/쉼표 아이콘 컴포넌트
// 깨지는 유니코드 음표 심볼 대신 직접 SVG로 그림

interface IconProps {
  size?: number;
  className?: string;
}

// ── 음표 아이콘 ──

export function WholeNote({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <ellipse cx="8" cy="9" rx="5" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function DottedHalfNote({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <ellipse cx="6" cy="11" rx="4" ry="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="10" y1="11" x2="10" y2="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="14" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function HalfNote({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <ellipse cx="6" cy="11" rx="4" ry="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="10" y1="11" x2="10" y2="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function DottedQuarterNote({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <ellipse cx="5.5" cy="11.5" rx="3.8" ry="2.8" fill="currentColor" />
      <line x1="9.3" y1="11" x2="9.3" y2="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13.5" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function QuarterNote({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <ellipse cx="6" cy="11.5" rx="4" ry="3" fill="currentColor" />
      <line x1="10" y1="11" x2="10" y2="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function DottedEighthNote({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <ellipse cx="4.5" cy="11.5" rx="3.5" ry="2.6" fill="currentColor" />
      <line x1="8" y1="11" x2="8" y2="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8,2 Q12,4 9,7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="13" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function EighthNote({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <ellipse cx="5" cy="11.5" rx="3.8" ry="2.8" fill="currentColor" />
      <line x1="8.8" y1="11" x2="8.8" y2="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8.8,2 Q13,4 10,7.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function SixteenthNote({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <ellipse cx="5" cy="11.5" rx="3.8" ry="2.8" fill="currentColor" />
      <line x1="8.8" y1="11" x2="8.8" y2="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8.8,2 Q13,3.5 10,6" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M8.8,4.5 Q13,6 10,8.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function ThirtySecondNote({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <ellipse cx="5" cy="12" rx="3.5" ry="2.5" fill="currentColor" />
      <line x1="8.5" y1="12" x2="8.5" y2="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8.5,1 Q12.5,2.5 9.5,4.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M8.5,3.5 Q12.5,5 9.5,7" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M8.5,6 Q12.5,7.5 9.5,9.5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

// ── 쉼표 아이콘 ──

export function WholeRest({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <line x1="3" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1" />
      <rect x="5" y="7" width="6" height="3" fill="currentColor" rx="0.5" />
    </svg>
  );
}

export function HalfRest({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <line x1="3" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1" />
      <rect x="5" y="7" width="6" height="3" fill="currentColor" rx="0.5" />
    </svg>
  );
}

export function QuarterRest({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <path
        d="M7,2 L10,5 L6,8 L10,11 Q7,13 7,14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EighthRest({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <circle cx="9" cy="5" r="1.5" fill="currentColor" />
      <line x1="10" y1="5" x2="6" y2="14" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function SixteenthRest({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <circle cx="9" cy="4" r="1.3" fill="currentColor" />
      <circle cx="10" cy="7.5" r="1.3" fill="currentColor" />
      <line x1="10" y1="4" x2="5" y2="14" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function ThirtySecondRest({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className}>
      <circle cx="9" cy="3" r="1.2" fill="currentColor" />
      <circle cx="10" cy="6" r="1.2" fill="currentColor" />
      <circle cx="11" cy="9" r="1.2" fill="currentColor" />
      <line x1="10" y1="3" x2="5" y2="14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
