import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Users,
  Music,
  Mic,
  MicOff,
  Volume2,
  LogOut,
  Radio,
  Send,
  MessageSquare,
  Wifi,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import { useJamSocket } from "~/lib/jam/use-jam-socket";
import { useWebRTC } from "~/lib/jam/use-webrtc";
import { AudioSynchronizer } from "~/lib/jam/audio-synchronizer";
import type { SyncState } from "~/lib/jam/audio-synchronizer";
import { ParticipantItem } from "~/components/jam/ParticipantItem";
import { ChatMessageItem } from "~/components/jam/ChatMessage";
import type { JamRoom, JamParticipant } from "~/types/jam-room";

export function meta() {
  return [
    { title: "합주방 - Tone Knob" },
    { name: "description", content: "실시간 온라인 합주" },
  ];
}

export default function JamroomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<JamRoom | null>(null);
  const [participants, setParticipants] = useState<JamParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [participantVolumes, setParticipantVolumes] = useState<
    Map<string, number>
  >(new Map());
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const syncRef = useRef<AudioSynchronizer | null>(null);
  const remoteAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const chatEndRef = useRef<HTMLDivElement>(null);

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
        prev.map((p) =>
          p.userId === data.userId ? { ...p, isMuted: data.isMuted } : p,
        ),
      );
    }, []),
    onWebRTCOffer: useCallback(
      (data: { fromUserId: string; signal: unknown }) => {
        void webrtcRef.current?.handleOffer(
          data.fromUserId,
          data.signal as RTCSessionDescriptionInit,
        );
      },
      [],
    ),
    onWebRTCAnswer: useCallback(
      (data: { fromUserId: string; signal: unknown }) => {
        void webrtcRef.current?.handleAnswer(
          data.fromUserId,
          data.signal as RTCSessionDescriptionInit,
        );
      },
      [],
    ),
    onICECandidate: useCallback(
      (data: { fromUserId: string; signal: unknown }) => {
        void webrtcRef.current?.handleICECandidate(
          data.fromUserId,
          data.signal as RTCIceCandidateInit,
        );
      },
      [],
    ),
    onPlaybackSynced: useCallback(
      (data: { fromUserId: string; position: number; isPlaying: boolean }) => {
        syncRef.current?.applyRemoteSync({
          position: data.position,
          isPlaying: data.isPlaying,
        });
      },
      [],
    ),
  });
  socketRef.current = socket;

  // WebRTC 훅
  const webrtc = useWebRTC({
    localStream,
    onSendOffer: useCallback(
      (targetUserId: string, signal: RTCSessionDescriptionInit) => {
        socketRef.current?.sendOffer(targetUserId, signal);
      },
      [],
    ),
    onSendAnswer: useCallback(
      (targetUserId: string, signal: RTCSessionDescriptionInit) => {
        socketRef.current?.sendAnswer(targetUserId, signal);
      },
      [],
    ),
    onSendICECandidate: useCallback(
      (targetUserId: string, signal: RTCIceCandidateInit) => {
        socketRef.current?.sendICECandidate(targetUserId, signal);
      },
      [],
    ),
  });
  webrtcRef.current = webrtc;

  // 리모트 스트림을 audio 엘리먼트에 연결
  useEffect(() => {
    webrtc.remoteStreams.forEach((stream, userId) => {
      let audio = remoteAudioRefs.current.get(userId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        remoteAudioRefs.current.set(userId, audio);
      }
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
    });

    // 제거된 피어의 audio 엘리먼트 정리
    remoteAudioRefs.current.forEach((audio, userId) => {
      if (!webrtc.remoteStreams.has(userId)) {
        audio.srcObject = null;
        remoteAudioRefs.current.delete(userId);
      }
    });
  }, [webrtc.remoteStreams]);

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
    if (!user) {
      navigate("/login");
      return;
    }
    if (!id) return;

    loadRoom();
  }, [id, user, navigate]);

  const loadRoom = async () => {
    if (!id) return;
    try {
      const roomData = await api.jamRooms.get(id);
      setRoom(roomData);
      await loadParticipants();
    } catch (error) {
      console.error("Failed to load room:", error);
      alert("합주방을 불러올 수 없습니다.");
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

  const handleJoinRoom = async () => {
    if (!id || !user) return;

    try {
      // 마이크 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);

      // API를 통해 합주방 참가
      await api.jamRooms.join(id, {});
      setHasJoined(true);
      await loadParticipants();
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("합주방 참가에 실패했습니다. 마이크 권한을 확인해주세요.");
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
    const audio = remoteAudioRefs.current.get(targetUserId);
    if (audio) {
      audio.volume = volume / 100;
    }
  };

  const getLatencyColor = (ms: number | null) => {
    if (ms === null) return "text-gray-400";
    if (ms < 50) return "text-green-500";
    if (ms < 100) return "text-yellow-500";
    return "text-red-500";
  };

  // 채팅 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [socket.chatMessages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          합주방을 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <button
        type="button"
        onClick={() => navigate("/jamroom")}
        className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft className="h-4 w-4" />
        합주방 목록으로
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 메인 영역 */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {room.name}
              </h1>
              {room.description && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {room.description}
                </p>
              )}
            </div>

            <div className="mb-6 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
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
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${socket.connected ? "bg-green-500" : "bg-gray-400"}`}
                />
                <span>{socket.connected ? "연결됨" : "연결 중..."}</span>
              </div>
              {socket.latency !== null && (
                <div className="flex items-center gap-1">
                  <Wifi
                    className={`h-4 w-4 ${getLatencyColor(socket.latency)}`}
                  />
                  <span className={getLatencyColor(socket.latency)}>
                    {socket.latency}ms
                  </span>
                </div>
              )}
            </div>

            {!hasJoined ? (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 dark:border-gray-700">
                <Music className="h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  합주방에 참가하여 함께 연주하세요
                </p>
                <Button className="mt-4" onClick={handleJoinRoom}>
                  합주방 참가
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 오디오 컨트롤 */}
                <div className="flex items-center justify-center gap-4 rounded-lg bg-gray-50 p-8 dark:bg-gray-800">
                  <Button
                    variant={isMuted ? "outline" : "default"}
                    size="lg"
                    onClick={handleToggleMute}
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="mr-2 h-5 w-5" />
                        음소거됨
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-5 w-5" />
                        마이크 켜짐
                      </>
                    )}
                  </Button>

                  <Button variant="outline" size="lg">
                    <Volume2 className="mr-2 h-5 w-5" />
                    볼륨
                  </Button>
                </div>

                {/* WebRTC 연결 상태 */}
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm">
                    <Radio className="h-4 w-4 text-violet-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      오디오 연결 ({webrtc.remoteStreams.size}명과 연결됨)
                    </span>
                  </div>
                  {webrtc.remoteStreams.size === 0 &&
                    participants.length > 1 && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        다른 참가자와 피어 연결을 설정하는 중...
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4 lg:col-span-1">
          {/* 참가자 목록 */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
              참가자 ({participants.length})
            </h2>

            <div className="space-y-2">
              {participants.map((participant) => (
                <ParticipantItem
                  key={participant.id}
                  participant={participant}
                  isHost={participant.userId === room.hostId}
                  isSelf={participant.userId === user?.id}
                  hasJoined={hasJoined}
                  volume={participantVolumes.get(participant.userId) ?? 100}
                  onVolumeChange={handleVolumeChange}
                />
              ))}
            </div>

            {hasJoined && (
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={handleLeaveRoom}
              >
                <LogOut className="mr-2 h-4 w-4" />
                합주방 나가기
              </Button>
            )}
          </div>

          {/* 채팅 */}
          {hasJoined && (
            <div className="flex h-80 flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  채팅
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-2">
                {socket.chatMessages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-gray-400">
                    메시지가 없습니다
                  </p>
                ) : (
                  socket.chatMessages.map((msg) => {
                    const sender = participants.find(
                      (p) => p.userId === msg.userId,
                    );
                    return (
                      <ChatMessageItem
                        key={msg.id}
                        msg={msg}
                        isMe={msg.userId === user?.id}
                        senderName={
                          sender?.user?.displayName ||
                          sender?.user?.username ||
                          "알 수 없음"
                        }
                      />
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={handleSendChat}
                className="flex gap-2 border-t border-gray-200 px-3 py-2 dark:border-gray-800"
              >
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  maxLength={500}
                  className="h-8 text-sm"
                />
                <Button type="submit" size="sm" className="h-8 px-2">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
