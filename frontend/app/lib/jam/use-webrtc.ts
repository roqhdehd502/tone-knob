import { useCallback, useEffect, useRef, useState } from "react";

import {
  AdaptiveBitrateController,
  applyJitterBufferConfig,
  optimizeSdpForMusic,
} from "./webrtc-audio-config";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
};

interface PeerState {
  userId: string;
  connection: RTCPeerConnection;
  remoteStream: MediaStream;
  reconnectAttempts: number;
  bitrateController: AdaptiveBitrateController | null;
}

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;
const PING_POLL_INTERVAL_MS = 3000;

interface UseWebRTCOptions {
  localStream: MediaStream | null;
  onSendOffer: (targetUserId: string, signal: RTCSessionDescriptionInit) => void;
  onSendAnswer: (targetUserId: string, signal: RTCSessionDescriptionInit) => void;
  onSendICECandidate: (targetUserId: string, signal: RTCIceCandidateInit) => void;
}

export function useWebRTC(options: UseWebRTCOptions) {
  const { localStream, onSendOffer, onSendAnswer, onSendICECandidate } = options;
  const peersRef = useRef<Map<string, PeerState>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerPings, setPeerPings] = useState<Map<string, number>>(new Map());

  // 피어 상태 업데이트 헬퍼
  const updateRemoteStreams = useCallback(() => {
    const streams = new Map<string, MediaStream>();
    peersRef.current.forEach((peer, userId) => {
      streams.set(userId, peer.remoteStream);
    });
    setRemoteStreams(new Map(streams));
  }, []);

  // 새 피어 연결 생성
  const createPeerConnection = useCallback(
    (remoteUserId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const remoteStream = new MediaStream();

      // 로컬 오디오 트랙 추가
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // 리모트 트랙 수신
      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        updateRemoteStreams();
      };

      // ICE candidate 이벤트
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          onSendICECandidate(remoteUserId, event.candidate.toJSON());
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === "failed") {
          const peer = peersRef.current.get(remoteUserId);
          if (peer && peer.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            peer.reconnectAttempts++;
            console.warn(
              `[WebRTC] Connection failed with ${remoteUserId}, retrying (${peer.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
            );
            peer.connection.close();
            peersRef.current.delete(remoteUserId);
            setTimeout(() => {
              void initiateConnection(remoteUserId);
            }, RECONNECT_DELAY_MS * peer.reconnectAttempts);
          } else {
            console.error(`[WebRTC] Max reconnect attempts reached for ${remoteUserId}`);
            removePeer(remoteUserId);
          }
        } else if (state === "disconnected") {
          // 일시적 끊김 — 짧은 대기 후 여전히 끊겨 있으면 정리
          setTimeout(() => {
            if (pc.iceConnectionState === "disconnected") {
              removePeer(remoteUserId);
            }
          }, 5000);
        } else if (state === "connected") {
          const peer = peersRef.current.get(remoteUserId);
          if (peer) {
            peer.reconnectAttempts = 0;
          }
        }
      };

      peersRef.current.set(remoteUserId, {
        userId: remoteUserId,
        connection: pc,
        remoteStream,
        reconnectAttempts: 0,
        bitrateController: null,
      });

      updateRemoteStreams();
      return pc;
    },
    [localStream, onSendICECandidate, updateRemoteStreams],
  );

  // 새 참가자에게 offer 전송 (initiator 역할)
  const initiateConnection = useCallback(
    async (remoteUserId: string) => {
      const pc = createPeerConnection(remoteUserId);
      try {
        const offer = await pc.createOffer();
        // Opus 음악 모드 최적화 적용
        const optimizedSdp = optimizeSdpForMusic(offer.sdp ?? "");
        const optimizedOffer = { ...offer, sdp: optimizedSdp };
        await pc.setLocalDescription(optimizedOffer);
        onSendOffer(remoteUserId, optimizedOffer);

        // Adaptive Bitrate 시작
        const peer = peersRef.current.get(remoteUserId);
        if (peer) {
          const abc = new AdaptiveBitrateController(pc);
          abc.start();
          peer.bitrateController = abc;
        }
      } catch (error) {
        console.error("Failed to create offer:", error);
      }
    },
    [createPeerConnection, onSendOffer],
  );

  // offer 수신 처리
  const handleOffer = useCallback(
    async (fromUserId: string, signal: RTCSessionDescriptionInit) => {
      const peer = peersRef.current.get(fromUserId);
      const pc = peer ? peer.connection : createPeerConnection(fromUserId);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        // Opus 음악 모드 최적화 적용
        const optimizedSdp = optimizeSdpForMusic(answer.sdp ?? "");
        const optimizedAnswer = { ...answer, sdp: optimizedSdp };
        await pc.setLocalDescription(optimizedAnswer);
        onSendAnswer(fromUserId, optimizedAnswer);

        // Jitter Buffer 설정
        applyJitterBufferConfig(pc, 0.05);

        // Adaptive Bitrate 시작
        const updatedPeer = peersRef.current.get(fromUserId);
        if (updatedPeer) {
          const abc = new AdaptiveBitrateController(pc);
          abc.start();
          updatedPeer.bitrateController = abc;
        }
      } catch (error) {
        console.error("Failed to handle offer:", error);
      }
    },
    [createPeerConnection, onSendAnswer],
  );

  // answer 수신 처리
  const handleAnswer = useCallback(
    async (fromUserId: string, signal: RTCSessionDescriptionInit) => {
      const peer = peersRef.current.get(fromUserId);
      if (!peer) return;

      try {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(signal));
        // 연결 수립 후 Jitter Buffer 설정
        applyJitterBufferConfig(peer.connection, 0.05);
      } catch (error) {
        console.error("Failed to handle answer:", error);
      }
    },
    [],
  );

  // ICE candidate 수신 처리
  const handleICECandidate = useCallback(
    async (fromUserId: string, signal: RTCIceCandidateInit) => {
      const peer = peersRef.current.get(fromUserId);
      if (!peer) return;

      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(signal));
      } catch (error) {
        console.error("Failed to add ICE candidate:", error);
      }
    },
    [],
  );

  // 피어 제거
  const removePeer = useCallback(
    (userId: string) => {
      const peer = peersRef.current.get(userId);
      if (peer) {
        peer.bitrateController?.stop();
        peer.connection.close();
        peersRef.current.delete(userId);
        updateRemoteStreams();
      }
    },
    [updateRemoteStreams],
  );

  // 전체 정리
  const closeAll = useCallback(() => {
    peersRef.current.forEach((peer) => {
      peer.bitrateController?.stop();
      peer.connection.close();
    });
    peersRef.current.clear();
    setRemoteStreams(new Map());
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      peersRef.current.forEach((peer) => {
        peer.bitrateController?.stop();
        peer.connection.close();
      });
      peersRef.current.clear();
    };
  }, []);

  // 피어별 RTT(ping) 주기 측정 — getStats()의 활성 candidate-pair에서 currentRoundTripTime 추출
  useEffect(() => {
    const interval = setInterval(() => {
      void (async () => {
        const next = new Map<string, number>();
        for (const [userId, peer] of peersRef.current) {
          try {
            const stats = await peer.connection.getStats();
            stats.forEach((report) => {
              if (
                report.type === "candidate-pair" &&
                report.state === "succeeded" &&
                typeof report.currentRoundTripTime === "number"
              ) {
                next.set(userId, Math.round(report.currentRoundTripTime * 1000));
              }
            });
          } catch {
            // 통계 조회 실패 시 해당 피어는 건너뜀
          }
        }
        setPeerPings(next);
      })();
    }, PING_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // 로컬 스트림 변경 시 기존 피어 트랙 교체
  useEffect(() => {
    if (!localStream) return;

    peersRef.current.forEach((peer) => {
      const senders = peer.connection.getSenders();
      localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          void sender.replaceTrack(track);
        }
      });
    });
  }, [localStream]);

  return {
    remoteStreams,
    peerPings,
    initiateConnection,
    handleOffer,
    handleAnswer,
    handleICECandidate,
    removePeer,
    closeAll,
  };
}
