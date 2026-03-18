/**
 * AudioMixer
 *
 * 합주방 내 전체 참가자 오디오 믹서 패널
 * - 본인: 로컬 모니터링 토글 + 레벨 미터 + 볼륨 조절
 * - 리모트 참가자: 레벨 미터 + 볼륨 조절
 */
import { memo } from "react";

import { Crown, Guitar, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

import type { JamParticipant } from "~/types/jam-room";

import { AudioLevelMeter } from "./AudioLevelMeter";

const INSTRUMENT_LABELS: Record<string, string> = {
  "electric-guitar": "일렉 기타",
  "acoustic-guitar": "어쿠스틱 기타",
  bass: "베이스",
  keyboard: "키보드",
  drums: "드럼",
  vocals: "보컬",
  other: "기타",
};

interface MixerChannelProps {
  participant: JamParticipant;
  isHost: boolean;
  isSelf: boolean;
  volume: number;
  level: number;
  monitoring?: boolean;
  onVolumeChange: (userId: string, volume: number) => void;
  onMonitoringToggle?: () => void;
}

const MixerChannel = memo(function MixerChannel({
  participant,
  isHost,
  isSelf,
  volume,
  level,
  monitoring,
  onVolumeChange,
  onMonitoringToggle,
}: MixerChannelProps) {
  const displayName = participant.user?.displayName || participant.user?.username || "Unknown";
  const isMuted = participant.isMuted;

  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
      {/* 유저 정보 행 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              isSelf
                ? "bg-miami-100 text-miami-700 dark:bg-miami-900/40 dark:text-miami-300"
                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {displayName}
              {isSelf && <span className="ml-1 text-xs text-miami-500">(나)</span>}
            </p>
            <div className="flex items-center gap-1.5">
              {isHost && (
                <span className="flex items-center gap-0.5 text-xs text-miami-600 dark:text-miami-400">
                  <Crown className="h-2.5 w-2.5" />
                  호스트
                </span>
              )}
              {participant.instrument && (
                <span className="flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500">
                  <Guitar className="h-2.5 w-2.5" />
                  {INSTRUMENT_LABELS[participant.instrument] || participant.instrument}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isMuted && <MicOff className="h-3.5 w-3.5 text-red-400" />}
        </div>
      </div>

      {/* 레벨 미터 */}
      <div className="mb-2">
        <AudioLevelMeter level={isMuted ? 0 : level} compact />
      </div>

      {/* 볼륨 슬라이더 */}
      <div className="flex items-center gap-2">
        {volume > 0 ? (
          <Volume2 className="h-3 w-3 shrink-0 text-gray-400" />
        ) : (
          <VolumeX className="h-3 w-3 shrink-0 text-gray-400" />
        )}
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(participant.userId, parseInt(e.target.value, 10))}
          className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-miami-500 dark:bg-gray-700"
        />
        <span className="w-7 shrink-0 text-right text-xs tabular-nums text-gray-500">{volume}</span>
      </div>

      {/* 본인인 경우 모니터링 토글 */}
      {isSelf && onMonitoringToggle && (
        <button
          type="button"
          onClick={onMonitoringToggle}
          className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
            monitoring
              ? "bg-miami-100 text-miami-700 dark:bg-miami-900/30 dark:text-miami-300"
              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          }`}
        >
          {monitoring ? (
            <>
              <Mic className="h-3 w-3" />
              모니터링 ON
            </>
          ) : (
            <>
              <MicOff className="h-3 w-3" />
              모니터링 OFF
            </>
          )}
        </button>
      )}
    </div>
  );
});

interface AudioMixerProps {
  participants: JamParticipant[];
  hostId: string;
  selfUserId: string;
  hasJoined: boolean;
  participantVolumes: Map<string, number>;
  participantLevels: Map<string, number>;
  selfMonitoring: boolean;
  onVolumeChange: (userId: string, volume: number) => void;
  onSelfMonitoringToggle: () => void;
}

export const AudioMixer = memo(function AudioMixer({
  participants,
  hostId,
  selfUserId,
  hasJoined,
  participantVolumes,
  participantLevels,
  selfMonitoring,
  onVolumeChange,
  onSelfMonitoringToggle,
}: AudioMixerProps) {
  if (!hasJoined) return null;

  // 본인을 맨 위에 정렬
  const sorted = [...participants].sort((a, b) => {
    if (a.userId === selfUserId) return -1;
    if (b.userId === selfUserId) return 1;
    return 0;
  });

  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
        🎚️ 오디오 믹서
      </h4>
      {sorted.map((p) => {
        const isSelf = p.userId === selfUserId;
        return (
          <MixerChannel
            key={p.id}
            participant={p}
            isHost={p.userId === hostId}
            isSelf={isSelf}
            volume={participantVolumes.get(p.userId) ?? 100}
            level={participantLevels.get(p.userId) ?? 0}
            monitoring={isSelf ? selfMonitoring : undefined}
            onVolumeChange={onVolumeChange}
            onMonitoringToggle={isSelf ? onSelfMonitoringToggle : undefined}
          />
        );
      })}
    </div>
  );
});
