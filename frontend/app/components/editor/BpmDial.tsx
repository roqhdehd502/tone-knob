import { useCallback, useRef, useState } from "react";

import { useI18n } from "~/context/i18n";

interface BpmDialProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (bpm: number) => void;
}

export function BpmDial({ value, min = 20, max = 300, onChange }: BpmDialProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ y: number; startValue: number } | null>(null);
  const dialRef = useRef<HTMLDivElement>(null);

  // 값 → 각도 (135° ~ 405° → 실제 -135° ~ 135°)
  const ratio = (value - min) / (max - min);
  const angle = -135 + ratio * 270;

  const clamp = useCallback((v: number) => Math.round(Math.max(min, Math.min(max, v))), [min, max]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { y: e.clientY, startValue: value };

      const onMove = (me: MouseEvent) => {
        if (!dragStartRef.current) return;
        const dy = dragStartRef.current.y - me.clientY;
        const sensitivity = me.shiftKey ? 0.2 : 1;
        const delta = dy * sensitivity;
        onChange(clamp(dragStartRef.current.startValue + delta));
      };

      const onUp = () => {
        setIsDragging(false);
        dragStartRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [value, onChange, clamp],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1 : -1;
      const step = e.shiftKey ? 5 : 1;
      onChange(clamp(value + delta * step));
    },
    [value, onChange, clamp],
  );

  const handleDoubleClick = useCallback(() => {
    const input = prompt(t("bpm.prompt"), String(value));
    if (input !== null) {
      const parsed = parseInt(input);
      if (!isNaN(parsed)) onChange(clamp(parsed));
    }
  }, [value, onChange, clamp]);

  // SVG 다이얼 크기
  const size = 64;
  const cx = size / 2;
  const cy = size / 2;
  const r = 24;

  // 눈금 생성
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const tickAngle = (-135 + i * 27) * (Math.PI / 180);
    const x1 = cx + (r + 2) * Math.cos(tickAngle);
    const y1 = cy + (r + 2) * Math.sin(tickAngle);
    const x2 = cx + (r + 5) * Math.cos(tickAngle);
    const y2 = cy + (r + 5) * Math.sin(tickAngle);
    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={i % 5 === 0 ? "#9ca3af" : "#d1d5db"}
        strokeWidth={i % 5 === 0 ? 1.5 : 0.8}
      />,
    );
  }

  // 인디케이터 (바늘)
  const indicatorAngle = angle * (Math.PI / 180);
  const ix = cx + (r - 6) * Math.cos(indicatorAngle - Math.PI / 2);
  const iy = cy + (r - 6) * Math.sin(indicatorAngle - Math.PI / 2);

  // 호 (현재 값까지 채운 부분)
  const startAngle = -135 * (Math.PI / 180) - Math.PI / 2;
  const endAngle = angle * (Math.PI / 180) - Math.PI / 2;
  const largeArc = angle + 135 > 180 ? 1 : 0;
  const arcX1 = cx + r * Math.cos(startAngle);
  const arcY1 = cy + r * Math.sin(startAngle);
  const arcX2 = cx + r * Math.cos(endAngle);
  const arcY2 = cy + r * Math.sin(endAngle);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={dialRef}
        className={`cursor-grab select-none ${isDragging ? "cursor-grabbing" : ""}`}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        title={t("bpm.title")}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* 배경 원 */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={3}
            className="dark:stroke-gray-700"
          />
          {/* 채운 호 */}
          <path
            d={`M ${arcX1} ${arcY1} A ${r} ${r} 0 ${largeArc} 1 ${arcX2} ${arcY2}`}
            fill="none"
            stroke="#0ABAB5"
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* 눈금 */}
          <g transform={`rotate(0, ${cx}, ${cy})`}>{ticks}</g>
          {/* 센터 원 */}
          <circle
            cx={cx}
            cy={cy}
            r={8}
            className={`${isDragging ? "fill-miami-200 dark:fill-miami-800" : "fill-gray-100 dark:fill-gray-800"}`}
            stroke="#9ca3af"
            strokeWidth={0.5}
          />
          {/* 바늘 */}
          <line
            x1={cx}
            y1={cy}
            x2={ix}
            y2={iy}
            stroke="#0ABAB5"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
          {value}
        </span>
        <span className="text-[10px] font-medium text-gray-400">BPM</span>
      </div>
    </div>
  );
}
