/**
 * AmpSimulatorPanel
 *
 * 가상 앰프 시뮬레이터 UI 패널
 * - 프리셋 선택 (Clean, Crunch, Overdrive, High Gain, Acoustic, Bass)
 * - 게인 / 마스터 / EQ / 리버브 / 딜레이 노브
 * - 캐비닛 시뮬레이션 토글
 * - 앰프 ON/OFF 토글
 */
import { useCallback } from "react";

import { Power, RotateCcw } from "lucide-react";

import type { AmpPreset, AmpSettings } from "~/lib/jam/amp-simulator";
import { AMP_PRESETS, DEFAULT_AMP_SETTINGS } from "~/lib/jam/amp-simulator";

interface AmpSimulatorPanelProps {
  settings: AmpSettings;
  onChange: (settings: AmpSettings) => void;
}

const PRESET_KEYS = Object.keys(AMP_PRESETS) as AmpPreset[];

function Knob({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <div className="relative h-10 w-10">
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-200 dark:text-gray-700"
            strokeDasharray="75.4"
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(135 20 20)"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-miami-500"
            strokeDasharray="75.4"
            strokeDashoffset={75.4 - (pct / 100) * 75.4}
            strokeLinecap="round"
            transform="rotate(135 20 20)"
          />
        </svg>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
      <span className="text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
        {value}
        {unit}
      </span>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
          checked ? "bg-miami-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className="absolute h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: checked ? "18px" : "2px", top: "2px" }}
        />
      </button>
      <span className="text-[11px] text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  );
}

export function AmpSimulatorPanel({ settings, onChange }: AmpSimulatorPanelProps) {
  const update = useCallback(
    (partial: Partial<AmpSettings>) => {
      onChange({ ...settings, ...partial });
    },
    [settings, onChange],
  );

  const applyPreset = useCallback(
    (preset: AmpPreset) => {
      const p = AMP_PRESETS[preset];
      onChange({
        ...settings,
        preset,
        gain: p.gain ?? settings.gain,
        bass: p.bass ?? settings.bass,
        mid: p.mid ?? settings.mid,
        treble: p.treble ?? settings.treble,
        master: p.master ?? settings.master,
        reverb: p.reverb ?? settings.reverb,
        cabinet: p.cabinet ?? settings.cabinet,
      });
    },
    [settings, onChange],
  );

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        settings.enabled
          ? "border-miami-400/50 bg-gray-900 dark:border-miami-600/40 dark:bg-gray-900"
          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
      }`}
    >
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => update({ enabled: !settings.enabled })}
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors ${
              settings.enabled
                ? "bg-miami-500 text-white shadow-lg shadow-miami-500/30"
                : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
          </button>
          <h4
            className={`text-sm font-bold ${
              settings.enabled ? "text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            🎸 가상 앰프
          </h4>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_AMP_SETTINGS, enabled: settings.enabled })}
          className="cursor-pointer text-xs text-gray-400 hover:text-gray-300"
          title="초기화"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {!settings.enabled && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          앰프를 켜면 가상 앰프 이펙트가 적용됩니다
        </p>
      )}

      {settings.enabled && (
        <div className="space-y-4">
          {/* 프리셋 선택 */}
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              프리셋
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_KEYS.map((key) => {
                const p = AMP_PRESETS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={`cursor-pointer rounded-lg border px-2 py-1.5 text-center text-[11px] font-medium transition-colors ${
                      settings.preset === key
                        ? "border-miami-500 bg-miami-500/20 text-miami-300"
                        : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                    }`}
                  >
                    <span className="text-sm">{p.emoji}</span>
                    <br />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 게인 & 마스터 */}
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              앰프
            </p>
            <div className="flex justify-around">
              <Knob
                label="Gain"
                value={settings.gain}
                min={0}
                max={10}
                step={0.5}
                onChange={(v) => update({ gain: v })}
              />
              <Knob
                label="Master"
                value={settings.master}
                min={0}
                max={10}
                step={0.5}
                onChange={(v) => update({ master: v })}
              />
            </div>
          </div>

          {/* 3밴드 EQ */}
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              EQ
            </p>
            <div className="flex justify-around">
              <Knob
                label="Bass"
                value={settings.bass}
                min={-12}
                max={12}
                step={1}
                unit="dB"
                onChange={(v) => update({ bass: v })}
              />
              <Knob
                label="Mid"
                value={settings.mid}
                min={-12}
                max={12}
                step={1}
                unit="dB"
                onChange={(v) => update({ mid: v })}
              />
              <Knob
                label="Treble"
                value={settings.treble}
                min={-12}
                max={12}
                step={1}
                unit="dB"
                onChange={(v) => update({ treble: v })}
              />
            </div>
          </div>

          {/* 이펙트 */}
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              이펙트
            </p>
            <div className="flex justify-around">
              <Knob
                label="Reverb"
                value={settings.reverb}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => update({ reverb: v })}
              />
              <Knob
                label="Delay"
                value={settings.delay}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => update({ delay: v })}
              />
              <Knob
                label="Time"
                value={settings.delayTime}
                min={50}
                max={1000}
                step={10}
                unit="ms"
                onChange={(v) => update({ delayTime: v })}
              />
            </div>
          </div>

          {/* 토글 옵션 */}
          <div className="flex flex-wrap gap-4">
            <Toggle
              checked={settings.cabinet}
              onChange={(v) => update({ cabinet: v })}
              label="캐비닛 시뮬"
            />
            <Toggle
              checked={settings.noiseGate > 0}
              onChange={(v) => update({ noiseGate: v ? 0.01 : 0 })}
              label="노이즈 게이트"
            />
          </div>
        </div>
      )}
    </div>
  );
}
