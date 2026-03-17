import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  timestamp: string;
}

interface JamSocketOptions {
  roomId: string;
  userId: string;
  onUserJoined?: (data: { userId: string; socketId: string }) => void;
  onUserLeft?: (data: { userId: string }) => void;
  onUserDisconnected?: (data: { userId: string }) => void;
  onWebRTCOffer?: (data: { fromUserId: string; signal: unknown }) => void;
  onWebRTCAnswer?: (data: { fromUserId: string; signal: unknown }) => void;
  onICECandidate?: (data: { fromUserId: string; signal: unknown }) => void;
  onUserMuted?: (data: { userId: string; isMuted: boolean }) => void;
  onPlaybackSynced?: (data: {
    fromUserId: string;
    position: number;
    isPlaying: boolean;
  }) => void;
}

export function useJamSocket(options: JamSocketOptions) {
  const {
    roomId,
    userId,
    onUserJoined,
    onUserLeft,
    onUserDisconnected,
    onWebRTCOffer,
    onWebRTCAnswer,
    onICECandidate,
    onUserMuted,
    onPlaybackSynced,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<
    Array<{
      userId: string;
      username: string;
      isMuted: boolean;
      volume: number;
    }>
  >([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const latencyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
    const socket = io(`${apiUrl}/jam`, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", { roomId, userId });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on(
      "room-joined",
      (data: { roomId: string; participants: unknown[] }) => {
        setParticipants(data.participants as typeof participants);
      },
    );

    socket.on("user-joined", (data: { userId: string; socketId: string }) => {
      onUserJoined?.(data);
    });

    socket.on("user-left", (data: { userId: string }) => {
      onUserLeft?.(data);
    });

    socket.on("user-disconnected", (data: { userId: string }) => {
      onUserDisconnected?.(data);
    });

    socket.on(
      "webrtc-offer",
      (data: { fromUserId: string; signal: unknown }) => {
        onWebRTCOffer?.(data);
      },
    );

    socket.on(
      "webrtc-answer",
      (data: { fromUserId: string; signal: unknown }) => {
        onWebRTCAnswer?.(data);
      },
    );

    socket.on(
      "webrtc-ice-candidate",
      (data: { fromUserId: string; signal: unknown }) => {
        onICECandidate?.(data);
      },
    );

    socket.on("user-muted", (data: { userId: string; isMuted: boolean }) => {
      onUserMuted?.(data);
    });

    socket.on(
      "playback-synced",
      (data: { fromUserId: string; position: number; isPlaying: boolean }) => {
        onPlaybackSynced?.(data);
      },
    );

    // 채팅 메시지 수신
    socket.on("chat-message", (data: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-99), data]);
    });

    // 지연시간 측정 응답
    socket.on("pong-latency", (data: { timestamp: number }) => {
      const rtt = Date.now() - data.timestamp;
      setLatency(rtt);
    });

    // 주기적 지연시간 측정 (5초마다)
    latencyIntervalRef.current = setInterval(() => {
      socket.emit("ping-latency", { timestamp: Date.now() });
    }, 5000);
    // 초기 측정
    socket.emit("ping-latency", { timestamp: Date.now() });

    return () => {
      if (latencyIntervalRef.current) {
        clearInterval(latencyIntervalRef.current);
      }
      socket.emit("leave-room", { roomId });
      socket.disconnect();
    };
  }, [
    roomId,
    userId,
    onUserJoined,
    onUserLeft,
    onUserDisconnected,
    onWebRTCOffer,
    onWebRTCAnswer,
    onICECandidate,
    onUserMuted,
    onPlaybackSynced,
  ]);

  const sendOffer = useCallback(
    (targetUserId: string, signal: unknown) => {
      socketRef.current?.emit("webrtc-offer", {
        roomId,
        targetUserId,
        signal,
      });
    },
    [roomId],
  );

  const sendAnswer = useCallback(
    (targetUserId: string, signal: unknown) => {
      socketRef.current?.emit("webrtc-answer", {
        roomId,
        targetUserId,
        signal,
      });
    },
    [roomId],
  );

  const sendICECandidate = useCallback(
    (targetUserId: string, signal: unknown) => {
      socketRef.current?.emit("webrtc-ice-candidate", {
        roomId,
        targetUserId,
        signal,
      });
    },
    [roomId],
  );

  const toggleMute = useCallback(
    (isMuted: boolean) => {
      socketRef.current?.emit("toggle-mute", { roomId, isMuted });
    },
    [roomId],
  );

  const syncPlayback = useCallback(
    (position: number, isPlaying: boolean) => {
      socketRef.current?.emit("sync-playback", {
        roomId,
        position,
        isPlaying,
      });
    },
    [roomId],
  );

  const sendChatMessage = useCallback(
    (message: string) => {
      socketRef.current?.emit("chat-message", { roomId, message });
    },
    [roomId],
  );

  return {
    connected,
    participants,
    chatMessages,
    latency,
    sendOffer,
    sendAnswer,
    sendICECandidate,
    toggleMute,
    syncPlayback,
    sendChatMessage,
  };
}
