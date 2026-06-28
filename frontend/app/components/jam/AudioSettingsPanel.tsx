/**
 * AudioSettingsPanel
 *
 * 심화 오디오 설정 패널
 * - 입출력 장치 선택 (오디오 인터페이스 포함)
 * - 샘플레이트, 버퍼 크기 (레이턴시 모드)
 * - 에코 캔슬레이션, 노이즈 서프레션, 자동 게인 컨트롤 토글
 * - 채널 수 (모노/스테레오)
 */
import { useCallback, useEffect, useState } from "react";

import { RefreshCw, Settings2 } from "lucide-react";

import type { AudioDevice, AudioSettings } from "~/lib/jam/audio-settings";
import {
  BUFFER_SIZE_OPTIONS,
  getDefaultSettings,
  listAudioDevices,
  SAMPLE_RATE_OPTIONS,
} from "~/lib/jam/audio-settings";

interface AudioSettingsPanelProps {
  settings: AudioSettings;
  onChange: (settings: AudioSettings) => void;
  compact?: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {description && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
          checked ? "bg-miami-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className="absolute h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: checked ? "18px" : "2px", top: "2px" }}
        />
      </button>
    </div>
  );
}

export function AudioSettingsPanel({
  settings,
  onChange,
  compact = false,
}: AudioSettingsPanelProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const inputDevices = devices.filter((d) => d.kind === "audioinput");
  const outputDevices = devices.filter((d) => d.kind === "audiooutput");

  const refreshDevices = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listAudioDevices();
      setDevices(list);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    void refreshDevices();

    // 장치 변경 이벤트 리스너 (USB 오디오 인터페이스 연결/해제 감지)
    const handler = () => void refreshDevices();
    navigator.mediaDevices?.addEventListener("devicechange", handler);
    return () => navigator.mediaDevices?.removeEventListener("devicechange", handler);
  }, [refreshDevices]);

  const update = (partial: Partial<AudioSettings>) => {
    onChange({ ...settings, ...partial });
  };

  if (compact && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full cursor-pointer items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <Settings2 className="h-3.5 w-3.5" />
        오디오 설정
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <Settings2 className="h-3.5 w-3.5" />
          오디오 설정
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshDevices}
            disabled={loading}
            className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="장치 목록 새로고침"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => onChange(getDefaultSettings())}
            className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            기본값
          </button>
          {compact && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              접기
            </button>
          )}
        </div>
      </div>

      {/* 입력 장치 */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
          🎤 입력 장치 (마이크 / 오디오 인터페이스)
        </label>
        <select
          value={settings.inputDeviceId}
          onChange={(e) => update({ inputDeviceId: e.target.value })}
          className="h-8 w-full cursor-pointer rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="default">시스템 기본값</option>
          {inputDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
          VST 플러그인을 거친 소리도 입력할 수 있습니다 — DAW/VST 호스트의 출력을 가상 오디오
          케이블(BlackHole, VB-Audio 등)로 라우팅하면 여기 목록에 입력 장치로 표시됩니다.
        </p>
      </div>

      {/* 출력 장치 */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
          🔊 출력 장치 (스피커 / 헤드폰)
        </label>
        <select
          value={settings.outputDeviceId}
          onChange={(e) => update({ outputDeviceId: e.target.value })}
          className="h-8 w-full cursor-pointer rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="default">시스템 기본값</option>
          {outputDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
        {outputDevices.length === 0 && (
          <p className="mt-1 text-[10px] text-gray-400">
            출력 장치 선택은 Chrome/Edge에서 지원됩니다
          </p>
        )}
      </div>

      {/* 샘플레이트 */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
          샘플레이트
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {SAMPLE_RATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ sampleRate: opt.value })}
              className={`cursor-pointer rounded border px-2 py-1.5 text-[11px] transition-colors ${
                settings.sampleRate === opt.value
                  ? "border-miami-400 bg-miami-50 text-miami-700 dark:border-miami-600 dark:bg-miami-950/40 dark:text-miami-300"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 버퍼 크기 / 레이턴시 모드 */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
          레이턴시 모드 (버퍼 크기)
        </label>
        <div className="space-y-1.5">
          {BUFFER_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ bufferSize: opt.value })}
              className={`flex w-full cursor-pointer items-start gap-2 rounded border px-2.5 py-2 text-left transition-colors ${
                settings.bufferSize === opt.value
                  ? "border-miami-400 bg-miami-50 dark:border-miami-600 dark:bg-miami-950/40"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
              }`}
            >
              <div
                className={`mt-0.5 h-3 w-3 shrink-0 rounded-full border-2 ${
                  settings.bufferSize === opt.value
                    ? "border-miami-500 bg-miami-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <div>
                <p
                  className={`text-xs font-medium ${
                    settings.bufferSize === opt.value
                      ? "text-miami-700 dark:text-miami-300"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {opt.label}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 채널 수 */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
          채널
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => update({ channelCount: 1 })}
            className={`cursor-pointer rounded border px-2 py-1.5 text-xs transition-colors ${
              settings.channelCount === 1
                ? "border-miami-400 bg-miami-50 text-miami-700 dark:border-miami-600 dark:bg-miami-950/40 dark:text-miami-300"
                : "border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
            }`}
          >
            모노 (1ch)
          </button>
          <button
            type="button"
            onClick={() => update({ channelCount: 2 })}
            className={`cursor-pointer rounded border px-2 py-1.5 text-xs transition-colors ${
              settings.channelCount === 2
                ? "border-miami-400 bg-miami-50 text-miami-700 dark:border-miami-600 dark:bg-miami-950/40 dark:text-miami-300"
                : "border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
            }`}
          >
            스테레오 (2ch)
          </button>
        </div>
      </div>

      {/* 오디오 프로세싱 옵션 */}
      <div className="space-y-3">
        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">
          오디오 프로세싱
        </label>
        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="space-y-3">
            <Toggle
              checked={settings.echoCancellation}
              onChange={(v) => update({ echoCancellation: v })}
              label="에코 캔슬레이션"
              description="일반 마이크 사용 시 ON, 오디오 인터페이스 시 OFF 권장"
            />
            <Toggle
              checked={settings.noiseSuppression}
              onChange={(v) => update({ noiseSuppression: v })}
              label="노이즈 서프레션"
              description="배경 소음 제거. 악기 연주 시 OFF 권장"
            />
            <Toggle
              checked={settings.autoGainControl}
              onChange={(v) => update({ autoGainControl: v })}
              label="자동 게인 컨트롤"
              description="자동 음량 조절. 악기 다이나믹 보존 시 OFF 권장"
            />
          </div>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          💡 오디오 인터페이스 사용 시 모든 프로세싱을 OFF로 설정하면 원음에 가까운 깨끗한 사운드를
          얻을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
