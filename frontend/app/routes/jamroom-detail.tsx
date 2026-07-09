import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

import {
  ArrowLeft,
  BookOpen,
  FileMusic,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Music,
  Music2,
  Radio,
  Send,
  Users,
  Volume2,
  Wifi,
} from "lucide-react";

import { TabCanvas } from "~/components/editor/TabCanvas";
import { AmpSimulatorPanel } from "~/components/jam/AmpSimulatorPanel";
import { AudioLevelMeter } from "~/components/jam/AudioLevelMeter";
import { AudioMixer } from "~/components/jam/AudioMixer";
import { ChatMessageItem } from "~/components/jam/ChatMessage";
import { MrPlayer } from "~/components/jam/MrPlayer";
import { SoundCheckPanel } from "~/components/jam/SoundCheckPanel";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { getAudioEngine } from "~/lib/audio/audio-engine";
import { useAuth } from "~/lib/auth";
import type { AmpSettings } from "~/lib/jam/amp-simulator";
import { DEFAULT_AMP_SETTINGS } from "~/lib/jam/amp-simulator";
import type { AudioSettings } from "~/lib/jam/audio-settings";
import {
  buildAudioContextOptions,
  buildMediaConstraints,
  loadAudioSettings,
  setOutputDevice,
} from "~/lib/jam/audio-settings";
import type { SyncState } from "~/lib/jam/audio-synchronizer";
import { AudioSynchronizer } from "~/lib/jam/audio-synchronizer";
import { getLatencyColor } from "~/lib/jam/latency";
import { useAudioMonitor } from "~/lib/jam/use-audio-monitor";
import type { MrControlEvent, MrSetEvent } from "~/lib/jam/use-jam-socket";
import { useJamSocket } from "~/lib/jam/use-jam-socket";
import { useWebRTC } from "~/lib/jam/use-webrtc";
import type { JamParticipant, JamRoom } from "~/types/jam-room";
import type { InstrumentType, TabDocument } from "~/types/tab";

export function meta() {
  return [
    { title: "Jam Room - Tone Knob" },
    { name: "description", content: "Real-time online jam session" },
  ];
}

export default function JamroomDetail() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const INSTRUMENT_OPTIONS: { value: InstrumentType; label: string; emoji: string }[] = [
    { value: "electric-guitar", label: t("jamroomDetail.electric"), emoji: "🎸" },
    { value: "acoustic-guitar", label: t("jamroomDetail.acoustic"), emoji: "🎶" },
    { value: "bass", label: t("jamroomDetail.bass"), emoji: "🎵" },
    { value: "keyboard", label: t("jamroomDetail.keyboard"), emoji: "🎹" },
  ];
  const [room, setRoom] = useState<JamRoom | null>(null);
  const [participants, setParticipants] = useState<JamParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [participantVolumes, setParticipantVolumes] = useState<Map<string, number>>(new Map());
  const [participantLevels, setParticipantLevels] = useState<Map<string, number>>(new Map());
  const [, setSyncState] = useState<SyncState | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>("electric-guitar");
  const [selfVolume, setSelfVolume] = useState(80);
  const [showSoundCheck, setShowSoundCheck] = useState(true);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(loadAudioSettings);
  const [ampSettings, setAmpSettings] = useState<AmpSettings>({ ...DEFAULT_AMP_SETTINGS });
  const [mrOpen, setMrOpen] = useState(false);
  const [remoteMr, setRemoteMr] = useState<MrSetEvent | null>(null);
  const [remoteControl, setRemoteControl] = useState<MrControlEvent | null>(null);
  const [tabOpen, setTabOpen] = useState(false);
  const [tabContent, setTabContent] = useState<TabDocument | null>(null);
  const syncRef = useRef<AudioSynchronizer | null>(null);
  const remoteAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 로컬 오디오 모니터 (내 마이크 → 레벨 측정 + 로컬 모니터링)
  const localMonitor = useAudioMonitor();
  // 리모트 오디오 모니터 맵 (레벨 측정용 AnalyserNode)
  const remoteMonitorsRef = useRef<
    Map<string, { ctx: AudioContext; analyser: AnalyserNode; source: MediaStreamAudioSourceNode }>
  >(new Map());

  // ref로 순환 참조 해결
  const socketRef = useRef<ReturnType<typeof useJamSocket>>(null!);
  const webrtcRef = useRef<ReturnType<typeof useWebRTC>>(null!);

  // Socket.IO 훅 (먼저 선언)
  const socket = useJamSocket({
    roomId: id || "",
    userId: user?.id || "",
    onUserJoined: useCallback(
      (data: { userId: string }) => {
        loadParticipants();
        if (hasJoined) {
          void webrtcRef.current?.initiateConnection(data.userId);
        }
      },
      [hasJoined],
    ),
    onUserLeft: useCallback((data: { userId: string }) => {
      loadParticipants();
      webrtcRef.current?.removePeer(data.userId);
    }, []),
    onUserDisconnected: useCallback((data: { userId: string }) => {
      loadParticipants();
      webrtcRef.current?.removePeer(data.userId);
    }, []),
    onUserMuted: useCallback((data: { userId: string; isMuted: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.userId === data.userId ? { ...p, isMuted: data.isMuted } : p)),
      );
    }, []),
    onWebRTCOffer: useCallback((data: { fromUserId: string; signal: unknown }) => {
      void webrtcRef.current?.handleOffer(
        data.fromUserId,
        data.signal as RTCSessionDescriptionInit,
      );
    }, []),
    onWebRTCAnswer: useCallback((data: { fromUserId: string; signal: unknown }) => {
      void webrtcRef.current?.handleAnswer(
        data.fromUserId,
        data.signal as RTCSessionDescriptionInit,
      );
    }, []),
    onICECandidate: useCallback((data: { fromUserId: string; signal: unknown }) => {
      void webrtcRef.current?.handleICECandidate(
        data.fromUserId,
        data.signal as RTCIceCandidateInit,
      );
    }, []),
    onPlaybackSynced: useCallback(
      (data: { fromUserId: string; position: number; isPlaying: boolean }) => {
        syncRef.current?.applyRemoteSync({
          position: data.position,
          isPlaying: data.isPlaying,
        });
      },
      [],
    ),
    onMrSet: useCallback((data: MrSetEvent) => {
      setRemoteMr(data);
      setMrOpen(true);
    }, []),
    onMrControl: useCallback((data: MrControlEvent) => {
      setRemoteControl({ ...data });
    }, []),
  });
  socketRef.current = socket;

  // WebRTC 훅
  const webrtc = useWebRTC({
    localStream,
    onSendOffer: useCallback((targetUserId: string, signal: RTCSessionDescriptionInit) => {
      socketRef.current?.sendOffer(targetUserId, signal);
    }, []),
    onSendAnswer: useCallback((targetUserId: string, signal: RTCSessionDescriptionInit) => {
      socketRef.current?.sendAnswer(targetUserId, signal);
    }, []),
    onSendICECandidate: useCallback((targetUserId: string, signal: RTCIceCandidateInit) => {
      socketRef.current?.sendICECandidate(targetUserId, signal);
    }, []),
  });
  webrtcRef.current = webrtc;

  // 리모트 스트림을 audio 엘리먼트 + 레벨 미터에 연결
  useEffect(() => {
    webrtc.remoteStreams.forEach((stream, userId) => {
      // Audio 엘리먼트 (소리 출력)
      let audio = remoteAudioRefs.current.get(userId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        remoteAudioRefs.current.set(userId, audio);
      }
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
      // 선택된 출력 장치를 매번 재적용 — 장치 변경 시 기존 엘리먼트에도 즉시 반영
      void setOutputDevice(audio, audioSettings.outputDeviceId);

      // 리모트 레벨 미터용 AnalyserNode
      if (!remoteMonitorsRef.current.has(userId)) {
        try {
          const ctx = new AudioContext();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.5;
          source.connect(analyser);
          remoteMonitorsRef.current.set(userId, { ctx, analyser, source });
        } catch (e) {
          console.warn("[AudioMixer] Failed to create remote analyser for", userId, e);
        }
      }
    });

    // 제거된 피어 정리
    remoteAudioRefs.current.forEach((audio, userId) => {
      if (!webrtc.remoteStreams.has(userId)) {
        audio.srcObject = null;
        remoteAudioRefs.current.delete(userId);
      }
    });
    remoteMonitorsRef.current.forEach((nodes, userId) => {
      if (!webrtc.remoteStreams.has(userId)) {
        nodes.source.disconnect();
        nodes.analyser.disconnect();
        void nodes.ctx.close();
        remoteMonitorsRef.current.delete(userId);
      }
    });
  }, [webrtc.remoteStreams, audioSettings.outputDeviceId]);

  // 모든 참가자(본인+리모트) 레벨 측정 루프
  useEffect(() => {
    if (!hasJoined) return;

    let raf: number;
    const data = new Uint8Array(128);

    const tick = () => {
      const levels = new Map<string, number>();

      // 본인 레벨
      if (user?.id) {
        levels.set(user.id, localMonitor.level);
      }

      // 리모트 레벨
      remoteMonitorsRef.current.forEach((nodes, userId) => {
        nodes.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        levels.set(userId, Math.min(1, rms * 2.5));
      });

      setParticipantLevels((prev) => {
        // 최적화: 변화가 없으면 리렌더 방지
        let changed = false;
        levels.forEach((v, k) => {
          if (Math.abs((prev.get(k) ?? 0) - v) > 0.01) changed = true;
        });
        if (!changed && prev.size === levels.size) return prev;
        return levels;
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [hasJoined, user?.id, localMonitor.level]);

  // AudioSynchronizer 초기화 및 latency 피딩
  useEffect(() => {
    if (hasJoined && room) {
      const sync = new AudioSynchronizer(room.bpm);
      sync.init();
      sync.setOnStateChange((state) => setSyncState(state));
      syncRef.current = sync;

      return () => {
        sync.dispose();
        syncRef.current = null;
      };
    }
  }, [hasJoined, room?.bpm]);

  // latency 샘플을 AudioSynchronizer에 전달
  useEffect(() => {
    if (socket.latency !== null && syncRef.current) {
      syncRef.current.addLatencySample(socket.latency);
    }
  }, [socket.latency]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!id) return;

    loadRoom();
  }, [id, user, authLoading, navigate]);

  const loadRoom = async () => {
    if (!id) return;
    try {
      const roomData = await api.jamRooms.get(id);
      setRoom(roomData);
      if (roomData.tab?.id) {
        try {
          const tabDetail = await api.tabs.get(roomData.tab.id);
          if (tabDetail.content?.sections?.length > 0) {
            setTabContent(tabDetail.content);
          }
        } catch {
          // Tab might be private or unavailable
        }
      }
      await loadParticipants();
    } catch (error) {
      console.error("Failed to load room:", error);
      alert(t("jamroomDetail.alertNotFound"));
      navigate("/jamroom");
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    if (!id) return;
    try {
      const data = await api.jamRooms.participants(id);
      setParticipants(data);
    } catch (error) {
      console.error("Failed to load participants:", error);
    }
  };

  // 사운드 체크 완료 후 참가 (스트림을 받아서 진행)
  const joinWithStream = async (stream: MediaStream, settings: AudioSettings) => {
    if (!id || !user) return;

    try {
      setLocalStream(stream);
      setAudioSettings(settings);

      // localMonitor가 아직 연결 안 된 경우에만 attach (사운드체크에서 이미 연결한 경우 스킵)
      if (!localMonitor.monitoring) {
        const ctxOpts = buildAudioContextOptions(settings);
        localMonitor.attach(stream, true, selfVolume / 100, ctxOpts, settings.outputDeviceId);
      }

      // 악기별 오디오 엔진 초기화
      const engine = getAudioEngine();
      await engine.setInstrument(selectedInstrument);
      const db = selfVolume <= 0 ? -Infinity : (selfVolume / 100) * 40 - 40;
      engine.setVolume(db);

      // API를 통해 합주방 참가
      await api.jamRooms.join(id, {});
      setHasJoined(true);
      setShowSoundCheck(false);
      await loadParticipants();
    } catch (error) {
      console.error("Failed to join room:", error);
      alert(t("jamroomDetail.alertJoinFailed"));
    }
  };

  // SoundCheckPanel에서 "확인 후 참가" 클릭 시
  const handleSoundCheckReady = (stream: MediaStream, settings: AudioSettings) => {
    void joinWithStream(stream, settings);
  };

  // 사운드 체크 없이 바로 참가
  const handleSkipSoundCheck = async () => {
    if (!id || !user) return;
    try {
      const settings = loadAudioSettings();
      const constraints = buildMediaConstraints(settings);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const ctxOpts = buildAudioContextOptions(settings);
      localMonitor.attach(stream, true, selfVolume / 100, ctxOpts, settings.outputDeviceId);
      await joinWithStream(stream, settings);
    } catch (error) {
      console.error("Failed to get microphone:", error);
      alert(t("jamroomDetail.alertMicRequired"));
    }
  };

  const handleInstrumentChange = async (inst: InstrumentType) => {
    setSelectedInstrument(inst);
    if (hasJoined) {
      const engine = getAudioEngine();
      await engine.setInstrument(inst);
    }
  };

  const handleSelfVolumeChange = (vol: number) => {
    setSelfVolume(vol);
    // 로컬 모니터링 gain 업데이트
    localMonitor.setGain(vol / 100);
    if (hasJoined) {
      const engine = getAudioEngine();
      const db = vol <= 0 ? -Infinity : (vol / 100) * 40 - 40;
      engine.setVolume(db);
    }
  };

  const handleLeaveRoom = async () => {
    if (!id) return;

    try {
      // WebRTC 정리
      webrtc.closeAll();

      // AudioSynchronizer 정리
      syncRef.current?.dispose();
      syncRef.current = null;

      // 로컬 모니터링 정리
      localMonitor.detach();

      // 로컬 스트림 정리
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      // 리모트 오디오 정리
      remoteAudioRefs.current.forEach((audio) => {
        audio.srcObject = null;
      });
      remoteAudioRefs.current.clear();

      // 리모트 모니터 정리
      remoteMonitorsRef.current.forEach((nodes) => {
        nodes.source.disconnect();
        nodes.analyser.disconnect();
        void nodes.ctx.close();
      });
      remoteMonitorsRef.current.clear();

      await api.jamRooms.leave(id);
      navigate("/jamroom");
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const handleToggleMute = () => {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      socket.toggleMute(!audioTrack.enabled);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  const handleVolumeChange = (targetUserId: string, volume: number) => {
    setParticipantVolumes((prev) => new Map(prev).set(targetUserId, volume));

    if (targetUserId === user?.id) {
      // 본인 볼륨: 로컬 모니터링 gain + 오디오 엔진
      handleSelfVolumeChange(volume);
    } else {
      // 리모트 볼륨: Audio 엘리먼트 볼륨
      const audio = remoteAudioRefs.current.get(targetUserId);
      if (audio) {
        audio.volume = volume / 100;
      }
    }
  };

  // 채팅 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [socket.chatMessages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-miami-500 border-t-transparent" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t("jamroomDetail.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button
        type="button"
        onClick={() => navigate("/jamroom")}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-miami-500 dark:text-gray-500"
      >
        <ArrowLeft className="h-3 w-3" />
        {t("jamroomDetail.backToList")}
      </button>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 메인 영역 */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{room.name}</h1>
                {room.description && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {room.description}
                  </p>
                )}
              </div>

              <div className="mb-5 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {room.currentParticipants}/{room.maxParticipants}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  <span>{room.bpm} BPM</span>
                </div>
                {room.tab && (
                  <a
                    href={`/tabs/${room.tab.id}`}
                    className="flex items-center gap-1.5 rounded-md bg-miami-50 px-2 py-0.5 text-miami-700 hover:bg-miami-100 dark:bg-miami-900/20 dark:text-miami-300 dark:hover:bg-miami-900/40"
                  >
                    <FileMusic className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">
                      {room.tab.title}
                      {room.tab.artist ? ` — ${room.tab.artist}` : ""}
                    </span>
                  </a>
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${socket.connected ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <span>
                    {socket.connected
                      ? t("jamroomDetail.connected")
                      : t("jamroomDetail.connecting")}
                  </span>
                </div>
                {socket.latency !== null && (
                  <div className="flex items-center gap-1">
                    <Wifi className={`h-3.5 w-3.5 ${getLatencyColor(socket.latency)}`} />
                    <span className={getLatencyColor(socket.latency)}>{socket.latency}ms</span>
                  </div>
                )}
              </div>

              {!hasJoined ? (
                showSoundCheck ? (
                  <SoundCheckPanel
                    selectedInstrument={selectedInstrument}
                    onInstrumentChange={(inst) => setSelectedInstrument(inst)}
                    onReady={handleSoundCheckReady}
                    onCancel={handleSkipSoundCheck}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 dark:border-gray-700">
                    <Music className="h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      {t("jamroomDetail.joining")}
                    </p>
                    <div className="mt-3 h-5 w-5 animate-spin rounded-full border-2 border-miami-500 border-t-transparent" />
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {/* 오디오 컨트롤 */}
                  <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                    <Button variant={isMuted ? "outline" : "default"} onClick={handleToggleMute}>
                      {isMuted ? (
                        <>
                          <MicOff className="mr-2 h-4 w-4" />
                          {t("jamroomDetail.muted")}
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          {t("jamroomDetail.micOn")}
                        </>
                      )}
                    </Button>

                    {/* 내 입력 레벨 미터 (간소화) */}
                    <div className="flex flex-1 items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t("jamroomDetail.inputLevel")}
                      </span>
                      <AudioLevelMeter level={isMuted ? 0 : localMonitor.level} compact />
                    </div>

                    {/* 로컬 모니터링 토글 */}
                    <button
                      type="button"
                      title={
                        localMonitor.monitoring
                          ? t("jamroomDetail.monitorOn")
                          : t("jamroomDetail.monitorOff")
                      }
                      onClick={() => localMonitor.setMonitoring(!localMonitor.monitoring)}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                        localMonitor.monitoring
                          ? "bg-miami-100 text-miami-700 dark:bg-miami-900/30 dark:text-miami-300"
                          : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      {t("jamroomDetail.monitor")}
                    </button>
                  </div>

                  {/* 악기 선택 (간소) */}
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t("jamroomDetail.instrument")}
                    </span>
                    <select
                      value={selectedInstrument}
                      onChange={(e) => handleInstrumentChange(e.target.value as InstrumentType)}
                      className="h-7 flex-1 rounded border border-gray-200 bg-transparent px-2 text-sm text-gray-600 outline-none dark:border-gray-700 dark:text-gray-300"
                    >
                      {INSTRUMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.emoji} {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t("jamroomDetail.volume")}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={selfVolume}
                      onChange={(e) => handleSelfVolumeChange(Number(e.target.value))}
                      className="h-1 w-24 cursor-pointer accent-miami-500"
                    />
                    <span className="w-6 text-right text-xs tabular-nums text-gray-500">
                      {selfVolume}
                    </span>
                  </div>

                  {/* WebRTC 연결 상태 */}
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm">
                      <Radio className="h-4 w-4 text-miami-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {t("jamroomDetail.audioPeerCount", { n: webrtc.remoteStreams.size })}
                      </span>
                    </div>
                    {webrtc.remoteStreams.size === 0 && participants.length > 1 && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {t("jamroomDetail.peerConnecting")}
                      </p>
                    )}
                  </div>

                  {/* MR 플레이어 */}
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setMrOpen((o) => !o)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <span className="flex items-center gap-2">
                        <Music2 className="h-4 w-4 text-miami-500" />
                        {t("jamroomDetail.mr")}
                      </span>
                      <span className="text-xs text-gray-400">{mrOpen ? "▲" : "▼"}</span>
                    </button>
                    <div
                      className={
                        mrOpen
                          ? "border-t border-gray-200 p-3 dark:border-gray-700"
                          : "hidden"
                      }
                    >
                      <MrPlayer
                        isHost={room.hostId === user?.id}
                        remoteMr={remoteMr}
                        remoteControl={remoteControl}
                        onSetMr={socket.emitMrSet}
                        onControl={socket.emitMrControl}
                      />
                    </div>
                  </div>

                  {/* 타브 악보 */}
                  {tabContent && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setTabOpen((o) => !o)}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-miami-500" />
                          {t("jamroomDetail.tab")}
                          {room.tab?.title && (
                            <span className="text-xs font-normal text-gray-400">
                              {room.tab.title}
                              {room.tab.artist ? ` — ${room.tab.artist}` : ""}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400">{tabOpen ? "▲" : "▼"}</span>
                      </button>
                      <div
                        className={
                          tabOpen
                            ? "overflow-auto border-t border-gray-200 p-3 dark:border-gray-700"
                            : "hidden"
                        }
                      >
                        <TabCanvas
                          sections={tabContent.sections}
                          tuning={tabContent.tuning}
                          selectedNoteIds={new Set()}
                          selectedMeasureId={null}
                          currentTool="select"
                          currentDuration={0.25}
                          currentFret={0}
                          onNoteClick={() => {}}
                          onCellClick={() => {}}
                          onMeasureClick={() => {}}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4 lg:col-span-1">
          {/* 참가자 & 오디오 믹서 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {t("jamroomDetail.participants", { n: participants.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasJoined ? (
                <AudioMixer
                  participants={participants}
                  hostId={room.hostId}
                  selfUserId={user?.id || ""}
                  hasJoined={hasJoined}
                  participantVolumes={participantVolumes}
                  participantLevels={participantLevels}
                  participantPings={webrtc.peerPings}
                  selfPing={socket.latency}
                  selfMonitoring={localMonitor.monitoring}
                  onVolumeChange={handleVolumeChange}
                  onSelfMonitoringToggle={() =>
                    localMonitor.setMonitoring(!localMonitor.monitoring)
                  }
                />
              ) : (
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                    >
                      <div className="h-7 w-7 rounded-full bg-miami-100 dark:bg-miami-900/30" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {p.user?.displayName || p.user?.username}
                        </p>
                        {p.userId === room.hostId && (
                          <span className="text-xs text-miami-600 dark:text-miami-400">
                            {t("jamroomDetail.host")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasJoined && (
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  size="sm"
                  onClick={handleLeaveRoom}
                >
                  <LogOut className="mr-1.5 h-4 w-4" />
                  {t("jamroomDetail.leave")}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 가상 앰프 */}
          {hasJoined && (
            <Card>
              <CardContent className="pt-4">
                <AmpSimulatorPanel
                  settings={ampSettings}
                  onChange={(newSettings) => {
                    setAmpSettings(newSettings);
                    if (newSettings.enabled && !localMonitor.ampEnabled) {
                      localMonitor.connectAmp(newSettings);
                    } else if (!newSettings.enabled && localMonitor.ampEnabled) {
                      localMonitor.disconnectAmp();
                    } else if (newSettings.enabled && localMonitor.ampEnabled) {
                      localMonitor.updateAmpSettings(newSettings);
                    }
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* 채팅 */}
          {hasJoined && (
            <Card className="flex h-80 flex-col overflow-hidden">
              <CardHeader className="flex-none border-b border-gray-200 pb-2 dark:border-gray-800">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                  {t("jamroomDetail.chat")}
                </CardTitle>
              </CardHeader>

              <div className="flex-1 overflow-y-auto px-4 py-2">
                {socket.chatMessages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-gray-400">
                    {t("jamroomDetail.noMessages")}
                  </p>
                ) : (
                  socket.chatMessages.map((msg) => {
                    const sender = participants.find((p) => p.userId === msg.userId);
                    return (
                      <ChatMessageItem
                        key={msg.id}
                        msg={msg}
                        isMe={msg.userId === user?.id}
                        senderName={
                          sender?.user?.displayName || sender?.user?.username || t("common.unknown")
                        }
                      />
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={handleSendChat}
                className="flex flex-none gap-2 border-t border-gray-200 px-3 py-2 dark:border-gray-800"
              >
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t("jamroomDetail.messagePlaceholder")}
                  maxLength={500}
                  className="h-8 text-sm"
                />
                <Button type="submit" size="sm" className="h-8 px-2">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
