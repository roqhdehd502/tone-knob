import { memo } from "react";

interface AudioLevelMeterProps {
  /** 0–1 범위의 오디오 레벨 */
  level: number;
  /** 바 방향 */
  direction?: "horizontal" | "vertical";
  /** 커스텀 높이/너비 (px) */
  size?: number;
  /** 간소화된 얇은 바 모드 */
  compact?: boolean;
}

export const AudioLevelMeter = memo(function AudioLevelMeter({
  level,
  direction = "horizontal",
  size,
  compact = false,
}: AudioLevelMeterProps) {
  const pct = Math.min(1, Math.max(0, level)) * 100;

  // 색상: 녹색 → 노랑 → 빨강
  const getColor = (l: number) => {
    if (l > 0.85) return "bg-red-500";
    if (l > 0.6) return "bg-yellow-400";
    return "bg-green-500";
  };

  if (direction === "vertical") {
    const h = size ?? (compact ? 40 : 60);
    return (
      <div
        className="relative overflow-hidden rounded-sm bg-gray-200 dark:bg-gray-700"
        style={{ width: compact ? 4 : 6, height: h }}
      >
        <div
          className={`absolute bottom-0 left-0 w-full rounded-sm transition-[height] duration-75 ${getColor(level)}`}
          style={{ height: `${pct}%` }}
        />
      </div>
    );
  }

  // horizontal
  const h = compact ? 3 : 6;
  return (
    <div
      className="relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
      style={{ height: size ?? h }}
    >
      <div
        className={`absolute left-0 top-0 h-full rounded-full transition-[width] duration-75 ${getColor(level)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
});
