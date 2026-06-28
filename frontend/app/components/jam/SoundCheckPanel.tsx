/**
 * SoundCheckPanel
 *
 * 합주방 참가 전 마이크/악기 사운드 테스트 패널
 * - 입출력 장치 선택 (오디오 인터페이스 포함)
 * - 심화 오디오 설정 (sampleRate, 버퍼, 프로세싱 옵션)
 * - 마이크 권한 요청 및 입력 스트림 획득
 * - 실시간 볼륨 레벨 미터
 * - 로컬 모니터링 토글 (내 소리를 내가 들을 수 있음)
 * - 악기 선택
 * - 테스트가 완료되면 onReady 콜백으로 스트림 + 설정 전달
 */
import { useCallback, useEffect, useState } from "react";

import { AlertCircle, CheckCircle, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

import { Button } from "~/components/ui/button";
import type { AudioSettings } from "~/lib/jam/audio-settings";
import {
  buildAudioContextOptions,
  buildMediaConstraints,
  loadAudioSettings,
  saveAudioSettings,
} from "~/lib/jam/audio-settings";
import { useAudioMonitor } from "~/lib/jam/use-audio-monitor";
import type { InstrumentType } from "~/types/tab";

import { AudioLevelMeter } from "./AudioLevelMeter";
import { AudioSettingsPanel } from "./AudioSettingsPanel";

const INSTRUMENT_OPTIONS: { value: InstrumentType; label: string; emoji: string }[] = [
  { value: "electric-guitar", label: "일렉 기타", emoji: "🎸" },
  { value: "acoustic-guitar", label: "어쿠스틱 기타", emoji: "🎶" },
  { value: "bass", label: "베이스", emoji: "🎵" },
  { value: "keyboard", label: "키보드", emoji: "🎹" },
];

interface SoundCheckPanelProps {
  selectedInstrument: InstrumentType;
  onInstrumentChange: (inst: InstrumentType) => void;
  /** 스트림 + 오디오 설정을 함께 전달 */
  onReady: (stream: MediaStream, settings: AudioSettings) => void;
  onCancel: () => void;
}

type CheckState = "idle" | "requesting" | "active" | "error";

export function SoundCheckPanel({
  selectedInstrument,
  onInstrumentChange,
  onReady,
  onCancel,
}: SoundCheckPanelProps) {
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(loadAudioSettings);
  const monitor = useAudioMonitor();

  const handleSettingsChange = useCallback((newSettings: AudioSettings) => {
    setAudioSettings(newSettings);
    saveAudioSettings(newSettings);
  }, []);

  const startCheck = useCallback(async () => {
    setCheckState("requesting");
    setErrorMsg("");
    try {
      const constraints = buildMediaConstraints(audioSettings);
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      setCheckState("active");
      // 설정 기반 AudioContext 옵션으로 로컬 모니터링 연결 (출력 장치 포함)
      const ctxOpts = buildAudioContextOptions(audioSettings);
      monitor.attach(s, true, 1, ctxOpts, audioSettings.outputDeviceId);
    } catch (err) {
      console.error("Microphone access failed:", err);
      setCheckState("error");
      setErrorMsg("마이크 접근에 실패했습니다. 장치 설정을 확인해주세요.");
    }
  }, [monitor, audioSettings]);

  const stopCheck = useCallback(() => {
    monitor.detach();
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCheckState("idle");
  }, [stream, monitor]);

  // 설정이 변경되면 활성 스트림 재시작 — nextSettings를 직접 받아 stale closure를 방지한다
  const restartWithNewSettings = useCallback(
    async (nextSettings: AudioSettings) => {
      if (checkState !== "active") return;
      monitor.detach();
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      try {
        const constraints = buildMediaConstraints(nextSettings);
        const s = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(s);
        const ctxOpts = buildAudioContextOptions(nextSettings);
        monitor.attach(s, true, monitor.gain, ctxOpts, nextSettings.outputDeviceId);
      } catch (err) {
        console.error("Failed to restart with new settings:", err);
        setCheckState("error");
        setErrorMsg("새 설정으로 마이크 접근에 실패했습니다.");
      }
    },
    [checkState, stream, monitor],
  );

  const handleConfirm = useCallback(() => {
    if (!stream) return;
    // 모니터링은 유지하면서 스트림 + 설정 전달
    onReady(stream, audioSettings);
  }, [stream, audioSettings, onReady]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      monitor.detach();
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 rounded-xl border-2 border-dashed border-gray-300 p-6 dark:border-gray-700">
      <div className="text-center">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">🎧 사운드 체크</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          참가 전 마이크와 악기 소리를 확인하세요
        </p>
      </div>

      {/* 악기 선택 */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">악기 선택</p>
        <div className="grid grid-cols-2 gap-2">
          {INSTRUMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onInstrumentChange(opt.value)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                selectedInstrument === opt.value
                  ? "border-miami-400 bg-miami-50 text-miami-700 dark:border-miami-600 dark:bg-miami-950/40 dark:text-miami-300"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 오디오 설정 (장치 선택 + 심화 옵션) */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <AudioSettingsPanel
          settings={audioSettings}
          onChange={(newSettings) => {
            const prevSettings = audioSettings;
            handleSettingsChange(newSettings);
            if (checkState !== "active") return;

            // 출력 장치만 바뀐 경우: 마이크 스트림을 재요청할 필요 없이 출력 싱크만 즉시 전환
            const onlyOutputChanged =
              newSettings.outputDeviceId !== prevSettings.outputDeviceId &&
              newSettings.inputDeviceId === prevSettings.inputDeviceId &&
              newSettings.sampleRate === prevSettings.sampleRate &&
              newSettings.bufferSize === prevSettings.bufferSize &&
              newSettings.echoCancellation === prevSettings.echoCancellation &&
              newSettings.noiseSuppression === prevSettings.noiseSuppression &&
              newSettings.autoGainControl === prevSettings.autoGainControl &&
              newSettings.channelCount === prevSettings.channelCount;

            if (onlyOutputChanged) {
              void monitor.setOutputDevice(newSettings.outputDeviceId);
            } else {
              void restartWithNewSettings(newSettings);
            }
          }}
          compact={checkState === "active"}
        />
      </div>

      {/* 마이크 테스트 영역 */}
      <div className="space-y-3">
        {checkState === "idle" && (
          <Button className="w-full" onClick={startCheck}>
            <Mic className="mr-2 h-4 w-4" />
            마이크 테스트 시작
          </Button>
        )}

        {checkState === "requesting" && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-miami-500 border-t-transparent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              마이크 권한을 요청하는 중...
            </span>
          </div>
        )}

        {checkState === "error" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">{errorMsg}</span>
            </div>
            <Button variant="outline" className="w-full" onClick={startCheck}>
              다시 시도
            </Button>
          </div>
        )}

        {checkState === "active" && (
          <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            {/* 음량 미터 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Mic className="h-3.5 w-3.5 text-green-500" />
                  입력 레벨
                </span>
                <span className="text-xs tabular-nums text-gray-500">
                  {Math.round(monitor.level * 100)}%
                </span>
              </div>
              <AudioLevelMeter level={monitor.level} size={8} />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {monitor.level > 0.05
                  ? "✅ 소리가 감지되고 있습니다"
                  : "⚠️ 소리가 감지되지 않습니다. 마이크를 확인하세요"}
              </p>
            </div>

            {/* 로컬 모니터링 토글 */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                {monitor.monitoring ? (
                  <Volume2 className="h-3.5 w-3.5 text-miami-500" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-gray-400" />
                )}
                내 소리 듣기 (모니터링)
              </span>
              <button
                type="button"
                onClick={() => monitor.setMonitoring(!monitor.monitoring)}
                className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
                  monitor.monitoring ? "bg-miami-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className="absolute h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: monitor.monitoring ? "18px" : "2px", top: "2px" }}
                />
              </button>
            </div>

            {/* 모니터링 볼륨 */}
            {monitor.monitoring && (
              <div className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(monitor.gain * 100)}
                  onChange={(e) => monitor.setGain(Number(e.target.value) / 100)}
                  className="h-1 flex-1 cursor-pointer accent-miami-500"
                />
                <span className="w-7 shrink-0 text-right text-xs tabular-nums text-gray-500">
                  {Math.round(monitor.gain * 100)}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={stopCheck}>
                <MicOff className="mr-1.5 h-3.5 w-3.5" />
                테스트 종료
              </Button>
              <Button size="sm" className="flex-1" onClick={handleConfirm}>
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                확인 후 참가
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 취소 */}
      {checkState !== "active" && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full cursor-pointer text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          사운드 체크 없이 참가
        </button>
      )}
    </div>
  );
}
