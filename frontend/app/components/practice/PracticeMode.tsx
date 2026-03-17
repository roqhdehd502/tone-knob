import { useState, useCallback, useRef, useEffect, memo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Minus,
  Plus,
  Timer,
  Gauge,
} from "lucide-react";
import { Button } from "~/components/ui/button";

interface PracticeModeProps {
  totalMeasures: number;
  onTempoChange?: (bpm: number) => void;
  onLoopChange?: (start: number, end: number, enabled: boolean) => void;
  onPlayStateChange?: (playing: boolean) => void;
  defaultBpm?: number;
}

const SPEED_PRESETS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1.0 },
  { label: "125%", value: 1.25 },
];

const PracticeMode = memo(function PracticeMode({
  totalMeasures,
  onTempoChange,
  onLoopChange,
  onPlayStateChange,
  defaultBpm = 120,
}: PracticeModeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(defaultBpm);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(1);
  const [loopEnd, setLoopEnd] = useState(Math.min(4, totalMeasures));
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const effectiveBpm = Math.round(bpm * speedMultiplier);

  useEffect(() => {
    onTempoChange?.(effectiveBpm);
  }, [effectiveBpm, onTempoChange]);

  useEffect(() => {
    onLoopChange?.(loopStart, loopEnd, loopEnabled);
  }, [loopStart, loopEnd, loopEnabled, onLoopChange]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      const msPerBeat = 60000 / effectiveBpm;
      const beatsPerMeasure = 4;
      const msPerMeasure = msPerBeat * beatsPerMeasure;

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startTimeRef.current) / 1000;
        setElapsedTime(elapsed);

        const measureProgress = Math.floor(elapsed / (msPerMeasure / 1000));
        let measure: number;

        if (loopEnabled) {
          const loopLength = loopEnd - loopStart + 1;
          measure = loopStart + (measureProgress % loopLength);
        } else {
          measure = Math.min(1 + measureProgress, totalMeasures);
          if (measure >= totalMeasures) {
            handleStop();
            return;
          }
        }
        setCurrentMeasure(measure);
      }, 50);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, effectiveBpm, loopEnabled, loopStart, loopEnd, totalMeasures]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlayStateChange?.(true);
  }, [onPlayStateChange]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPlayStateChange?.(false);
  }, [onPlayStateChange]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentMeasure(loopEnabled ? loopStart : 1);
    setElapsedTime(0);
    onPlayStateChange?.(false);
  }, [loopEnabled, loopStart, onPlayStateChange]);

  const adjustBpm = useCallback(
    (delta: number) => {
      setBpm((prev) => Math.max(20, Math.min(300, prev + delta)));
    },
    [],
  );

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <Gauge className="h-5 w-5 text-violet-500" />
          연습 모드
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Timer className="h-4 w-4" />
          {formatTime(elapsedTime)}
        </div>
      </div>

      {/* 재생 컨트롤 */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <Button size="sm" variant="outline" onClick={handleStop}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        {isPlaying ? (
          <Button
            size="sm"
            className="h-10 w-10 rounded-full bg-violet-600 hover:bg-violet-700"
            onClick={handlePause}
          >
            <Pause className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-10 w-10 rounded-full bg-violet-600 hover:bg-violet-700"
            onClick={handlePlay}
          >
            <Play className="ml-0.5 h-5 w-5" />
          </Button>
        )}
        <span className="min-w-[3rem] text-center text-sm font-medium text-gray-700 dark:text-gray-300">
          마디 {currentMeasure}
        </span>
      </div>

      {/* BPM 조절 */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
          템포 (BPM)
        </label>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => adjustBpm(-5)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <div className="flex-1">
            <input
              type="range"
              min={20}
              max={300}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full accent-violet-600"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => adjustBpm(5)}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <span className="w-16 text-center text-sm font-bold text-gray-900 dark:text-white">
            {bpm}
          </span>
        </div>
      </div>

      {/* 속도 배율 프리셋 */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
          속도 배율 (실제 BPM: {effectiveBpm})
        </label>
        <div className="flex gap-1">
          {SPEED_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setSpeedMultiplier(preset.value)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                speedMultiplier === preset.value
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 루프 설정 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            루프 구간
          </label>
          <button
            onClick={() => setLoopEnabled(!loopEnabled)}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
              loopEnabled
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
            }`}
          >
            <Repeat className="h-3 w-3" />
            {loopEnabled ? "ON" : "OFF"}
          </button>
        </div>
        {loopEnabled && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[10px] text-gray-400">
                시작 마디
              </label>
              <input
                type="number"
                min={1}
                max={loopEnd}
                value={loopStart}
                onChange={(e) =>
                  setLoopStart(
                    Math.max(1, Math.min(Number(e.target.value), loopEnd)),
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-700"
              />
            </div>
            <span className="mt-4 text-gray-400">~</span>
            <div className="flex-1">
              <label className="mb-1 block text-[10px] text-gray-400">
                끝 마디
              </label>
              <input
                type="number"
                min={loopStart}
                max={totalMeasures}
                value={loopEnd}
                onChange={(e) =>
                  setLoopEnd(
                    Math.max(
                      loopStart,
                      Math.min(Number(e.target.value), totalMeasures),
                    ),
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-700"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default PracticeMode;
