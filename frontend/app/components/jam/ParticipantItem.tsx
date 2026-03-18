import { memo } from "react";
import { MicOff, Volume2, Guitar } from "lucide-react";
import type { JamParticipant } from "~/types/jam-room";
import type { InstrumentType } from "~/types/tab";

const INSTRUMENT_LABELS: Record<string, string> = {
  "electric-guitar": "일렉 기타",
  "acoustic-guitar": "어쿠스틱 기타",
  bass: "베이스",
  keyboard: "키보드",
  drums: "드럼",
  vocals: "보컬",
  other: "기타",
};

interface ParticipantItemProps {
  participant: JamParticipant;
  isHost: boolean;
  isSelf: boolean;
  hasJoined: boolean;
  volume: number;
  onVolumeChange: (userId: string, volume: number) => void;
}

export const ParticipantItem = memo(function ParticipantItem({
  participant,
  isHost,
  isSelf,
  hasJoined,
  volume,
  onVolumeChange,
}: ParticipantItemProps) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-miami-100 dark:bg-miami-900/30" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {participant.user?.displayName || participant.user?.username}
            </p>
            <div className="flex items-center gap-1.5">
              {isHost && <span className="text-xs text-miami-600 dark:text-miami-400">호스트</span>}
              {participant.instrument && (
                <span className="flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500">
                  <Guitar className="h-3 w-3" />
                  {INSTRUMENT_LABELS[participant.instrument] || participant.instrument}
                </span>
              )}
            </div>
          </div>
        </div>
        {participant.isMuted && <MicOff className="h-4 w-4 text-gray-400" />}
      </div>
      {hasJoined && !isSelf && (
        <div className="mt-2 flex items-center gap-2">
          <Volume2 className="h-3 w-3 text-gray-400" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(participant.userId, parseInt(e.target.value, 10))}
            className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-miami-500 dark:bg-gray-700"
          />
          <span className="w-7 text-right text-xs text-gray-500">{volume}</span>
        </div>
      )}
    </div>
  );
});
