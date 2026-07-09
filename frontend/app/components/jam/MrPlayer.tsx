import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useI18n } from "~/context/i18n";
import type { MrControlEvent, MrSetEvent } from "~/lib/jam/use-jam-socket";

// YouTube IFrame API minimal typings
interface YtPlayerOptions {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, number | string>;
  events?: {
    onStateChange?: (e: { data: number }) => void;
    onError?: () => void;
  };
}

interface YtPlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  destroy(): void;
}

interface YtPlayerConstructor {
  new (container: HTMLElement, options: YtPlayerOptions): YtPlayerInstance;
}

declare global {
  interface Window {
    YT: {
      Player: YtPlayerConstructor;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// 모듈 레벨에서 YouTube IFrame API 로딩 상태 관리
let _ytState: "idle" | "loading" | "ready" = "idle";
const _ytCallbacks: (() => void)[] = [];

function ensureYtApi(cb: () => void) {
  if (_ytState === "ready") {
    cb();
    return;
  }
  _ytCallbacks.push(cb);
  if (_ytState === "idle") {
    _ytState = "loading";
    window.onYouTubeIframeAPIReady = () => {
      _ytState = "ready";
      _ytCallbacks.splice(0).forEach((f) => f());
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  }
}

function parseYtVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

interface MrPlayerProps {
  isHost: boolean;
  remoteMr: MrSetEvent | null;
  remoteControl: MrControlEvent | null;
  onSetMr: (type: "youtube", videoId: string) => void;
  onControl: (action: "play" | "pause", position?: number) => void;
}

export function MrPlayer({ isHost, remoteMr, remoteControl, onSetMr, onControl }: MrPlayerProps) {
  const { t } = useI18n();
  const [ytInput, setYtInput] = useState("");
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);
  const [ytError, setYtError] = useState(false);

  const ytParentRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YtPlayerInstance | null>(null);

  // 비호스트: 호스트가 설정한 MR 수신
  useEffect(() => {
    if (isHost || !remoteMr) return;
    setYtVideoId(remoteMr.videoId);
  }, [isHost, remoteMr]);

  // 비호스트: 호스트의 재생 제어 수신
  useEffect(() => {
    if (isHost || !remoteControl) return;
    const { action } = remoteControl;
    if (ytPlayerRef.current) {
      if (action === "play") ytPlayerRef.current.playVideo();
      else if (action === "pause") ytPlayerRef.current.pauseVideo();
    }
  }, [isHost, remoteControl]);

  // YouTube 플레이어 초기화
  useEffect(() => {
    if (!ytVideoId || !ytParentRef.current) return;

    setYtError(false);
    const parent = ytParentRef.current;

    ytPlayerRef.current?.destroy();
    ytPlayerRef.current = null;
    parent.innerHTML = "";
    const container = document.createElement("div");
    parent.appendChild(container);

    ensureYtApi(() => {
      ytPlayerRef.current = new window.YT.Player(container, {
        videoId: ytVideoId,
        width: "100%",
        height: "220",
        playerVars: { rel: 0, modestbranding: 1, controls: 1 },
        events: {
          onStateChange: (e) => {
            if (!isHost) return;
            if (e.data === window.YT.PlayerState.PLAYING) {
              onControl("play");
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              onControl("pause", ytPlayerRef.current?.getCurrentTime());
            }
          },
          onError: () => setYtError(true),
        },
      });
    });

    return () => {
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
      parent.innerHTML = "";
    };
  }, [ytVideoId, isHost, onControl]);

  const handleYtLoad = () => {
    const videoId = parseYtVideoId(ytInput.trim());
    if (!videoId) {
      setYtError(true);
      return;
    }
    setYtError(false);
    setYtVideoId(videoId);
    onSetMr("youtube", videoId);
  };

  return (
    <div className="space-y-2">
      {isHost && (
        <div className="flex gap-2">
          <Input
            value={ytInput}
            onChange={(e) => {
              setYtInput(e.target.value);
              setYtError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleYtLoad();
            }}
            placeholder={t("mr.ytUrlPlaceholder")}
            className="h-8 text-xs"
          />
          <Button size="sm" className="h-8 shrink-0 px-3" onClick={handleYtLoad}>
            {t("mr.load")}
          </Button>
        </div>
      )}
      {ytError && <p className="text-xs text-red-500">{t("mr.ytInvalidUrl")}</p>}
      <div ref={ytParentRef} className="overflow-hidden rounded-lg" />
      {!ytVideoId && (
        <p className="py-3 text-center text-xs text-gray-400 dark:text-gray-500">
          {isHost ? t("mr.ytHint") : t("mr.waitingHost")}
        </p>
      )}
    </div>
  );
}
