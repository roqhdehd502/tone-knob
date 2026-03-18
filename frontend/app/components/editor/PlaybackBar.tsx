import { Play, Pause, Square, SkipBack, Volume2, Guitar } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { PlaybackState, PlaybackPosition } from "~/lib/audio/audio-engine";
import type { InstrumentType } from "~/types/tab";

const INSTRUMENT_OPTIONS: { value: InstrumentType; label: string }[] = [
  { value: "electric-guitar", label: "일렉 기타" },
  { value: "acoustic-guitar", label: "어쿠스틱 기타" },
  { value: "bass", label: "베이스" },
  { value: "keyboard", label: "키보드" },
];

interface PlaybackBarProps {
  state: PlaybackState;
  position: PlaybackPosition;
  bpm: number;
  metronome: boolean;
  instrument?: InstrumentType;
  volume?: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleMetronome: () => void;
  onInstrumentChange?: (instrument: InstrumentType) => void;
  onVolumeChange?: (volume: number) => void;
}

export function PlaybackBar({
  state,
  position,
  bpm,
  metronome,
  instrument,
  volume,
  onPlay,
  onPause,
  onStop,
  onToggleMetronome,
  onInstrumentChange,
  onVolumeChange,
}: PlaybackBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
      {/* 재생 컨트롤 */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onStop}
          disabled={state === "stopped"}
          title="처음으로 (Stop)"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {state === "playing" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-miami-600 dark:text-miami-400"
            onClick={onPause}
            title="일시정지 (Space)"
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onPlay}
            title="재생 (Space)"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onStop}
          disabled={state === "stopped"}
          title="정지"
        >
          <Square className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* 구분선 */}
      <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

      {/* 위치 표시 */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-mono tabular-nums">
          S{position.sectionIndex + 1} M{position.measureIndex + 1}
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span className="font-mono tabular-nums">Beat {Math.floor(position.beat) + 1}</span>
      </div>

      {/* 구분선 */}
      <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

      {/* BPM */}
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">♩ = {bpm}</span>

      {/* 구분선 */}
      <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

      {/* 메트로놈 토글 */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 gap-1 px-2 text-xs ${
          metronome ? "text-miami-600 dark:text-miami-400" : "text-gray-400 dark:text-gray-500"
        }`}
        onClick={onToggleMetronome}
        title="메트로놈 (M)"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2 L7 22 L17 22 Z" />
          <line x1="12" y1="8" x2="18" y2="4" />
        </svg>
        메트로놈
      </Button>

      {/* 악기 선택 */}
      {onInstrumentChange && instrument && (
        <>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <Guitar className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={instrument}
              onChange={(e) => onInstrumentChange(e.target.value as InstrumentType)}
              className="h-7 rounded border border-gray-200 bg-transparent px-1.5 text-xs text-gray-600 outline-none dark:border-gray-700 dark:text-gray-300"
            >
              {INSTRUMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* 볼륨 */}
      {onVolumeChange && volume !== undefined && (
        <>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-gray-400" />
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="h-1 w-16 cursor-pointer accent-miami-500"
            />
          </div>
        </>
      )}

      {/* 재생 상태 표시 */}
      <div className="ml-auto flex items-center gap-1.5">
        {state === "playing" && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            재생 중
          </span>
        )}
        {state === "paused" && (
          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            일시정지
          </span>
        )}
      </div>
    </div>
  );
}
