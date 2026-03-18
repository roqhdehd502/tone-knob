/**
 * WebRTC Audio Configuration
 *
 * - Opus 코덱 우선 설정 (음악에 최적화)
 * - Adaptive Bitrate (네트워크 상태에 따른 비트레이트 조절)
 * - Jitter Buffer 튜닝 (playout delay 최소화)
 */

/** Opus 코덱을 SDP에서 최우선으로 설정 */
export function preferOpusCodec(sdp: string): string {
  const lines = sdp.split("\r\n");
  const mLineIndex = lines.findIndex((l) => l.startsWith("m=audio"));
  if (mLineIndex === -1) return sdp;

  // Opus payload type 찾기
  const opusLine = lines.find((l) => l.toLowerCase().includes("opus/48000"));
  if (!opusLine) return sdp;

  const match = opusLine.match(/^a=rtpmap:(\d+)\s+opus/i);
  if (!match) return sdp;
  const opusPT = match[1];

  // m= 라인에서 Opus를 첫 번째로 이동
  const mLine = lines[mLineIndex];
  const parts = mLine.split(" ");
  // m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 ...
  const header = parts.slice(0, 3);
  const payloads = parts.slice(3);
  const reordered = [opusPT, ...payloads.filter((p) => p !== opusPT)];
  lines[mLineIndex] = [...header, ...reordered].join(" ");

  return lines.join("\r\n");
}

/** Opus fmtp 파라미터 설정 (음악 모드 최적화) */
export function setOpusMusicMode(sdp: string): string {
  const lines = sdp.split("\r\n");

  // Opus payload type 찾기
  const rtpmapLine = lines.find((l) => l.toLowerCase().includes("opus/48000"));
  if (!rtpmapLine) return sdp;

  const match = rtpmapLine.match(/^a=rtpmap:(\d+)\s+opus/i);
  if (!match) return sdp;
  const opusPT = match[1];

  // 기존 fmtp 라인 찾기 또는 새로 생성
  const fmtpIndex = lines.findIndex((l) => l.startsWith(`a=fmtp:${opusPT}`));

  // 음악 모드 파라미터:
  // stereo=1: 스테레오 수신 허용
  // sprop-stereo=1: 스테레오 전송
  // maxaveragebitrate=128000: 최대 평균 비트레이트 128kbps
  // useinbandfec=1: 패킷 손실 복구 (FEC)
  // usedtx=0: DTX 비활성화 (음악에서는 무음 구간도 전송)
  const musicParams = [
    "stereo=1",
    "sprop-stereo=1",
    "maxaveragebitrate=128000",
    "useinbandfec=1",
    "usedtx=0",
  ].join(";");

  if (fmtpIndex !== -1) {
    // 기존 파라미터에 음악 모드 추가
    const existing = lines[fmtpIndex];
    const existingParams = existing.split(" ").slice(1).join(" ");
    const merged = mergeParams(existingParams, musicParams);
    lines[fmtpIndex] = `a=fmtp:${opusPT} ${merged}`;
  } else {
    // rtpmap 다음에 fmtp 삽입
    const rtpmapIndex = lines.indexOf(rtpmapLine);
    lines.splice(rtpmapIndex + 1, 0, `a=fmtp:${opusPT} ${musicParams}`);
  }

  return lines.join("\r\n");
}

function mergeParams(existing: string, additions: string): string {
  const params = new Map<string, string>();
  for (const param of existing.split(";")) {
    const [key, value] = param.split("=");
    if (key) params.set(key.trim(), value?.trim() ?? "");
  }
  for (const param of additions.split(";")) {
    const [key, value] = param.split("=");
    if (key) params.set(key.trim(), value?.trim() ?? "");
  }
  return Array.from(params.entries())
    .map(([k, v]) => (v ? `${k}=${v}` : k))
    .join(";");
}

/**
 * SDP에 Opus 최적화를 적용하는 통합 함수
 */
export function optimizeSdpForMusic(sdp: string): string {
  let optimized = preferOpusCodec(sdp);
  optimized = setOpusMusicMode(optimized);
  return optimized;
}

/**
 * Adaptive Bitrate Controller
 *
 * WebRTC getStats() 기반으로 네트워크 상태를 모니터링하고
 * Sender의 비트레이트를 동적으로 조절합니다.
 */
export class AdaptiveBitrateController {
  private pc: RTCPeerConnection;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentBitrate = 128000; // 128kbps 기본값
  private readonly minBitrate = 32000; // 32kbps
  private readonly maxBitrate = 256000; // 256kbps
  private readonly stepUp = 16000; // 16kbps씩 증가
  private readonly stepDown = 32000; // 32kbps씩 감소
  private prevBytesSent = 0;
  private prevTimestamp = 0;
  private consecutiveGood = 0;

  constructor(pc: RTCPeerConnection) {
    this.pc = pc;
  }

  start(intervalMs = 3000) {
    this.intervalId = setInterval(() => {
      void this.adjust();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async adjust() {
    try {
      const stats = await this.pc.getStats();
      let packetLoss = 0;
      let roundTripTime = 0;

      stats.forEach((report) => {
        if (report.type === "outbound-rtp" && report.kind === "audio") {
          const bytesSent = report.bytesSent as number;
          const ts = report.timestamp as number;

          if (this.prevBytesSent > 0 && this.prevTimestamp > 0) {
            // 실제 전송 비트레이트 계산 (참고용)
            const _elapsed = (ts - this.prevTimestamp) / 1000;
            const _bytesDiff = bytesSent - this.prevBytesSent;
          }

          this.prevBytesSent = bytesSent;
          this.prevTimestamp = ts;
        }

        if (report.type === "remote-inbound-rtp" && report.kind === "audio") {
          packetLoss = (report.fractionLost as number) ?? 0;
          roundTripTime = (report.roundTripTime as number) ?? 0;
        }
      });

      // 비트레이트 조절 로직
      if (packetLoss > 0.1 || roundTripTime > 0.3) {
        // 패킷 손실 > 10% 또는 RTT > 300ms → 비트레이트 감소
        this.currentBitrate = Math.max(this.minBitrate, this.currentBitrate - this.stepDown);
        this.consecutiveGood = 0;
      } else if (packetLoss < 0.02 && roundTripTime < 0.1) {
        // 패킷 손실 < 2% 및 RTT < 100ms → 점진적 증가
        this.consecutiveGood++;
        if (this.consecutiveGood >= 3) {
          this.currentBitrate = Math.min(this.maxBitrate, this.currentBitrate + this.stepUp);
          this.consecutiveGood = 0;
        }
      }

      // 비트레이트 적용
      await this.applyBitrate();
    } catch {
      // stats 조회 실패 시 무시
    }
  }

  private async applyBitrate() {
    const senders = this.pc.getSenders();
    for (const sender of senders) {
      if (sender.track?.kind === "audio") {
        const params = sender.getParameters();
        if (!params.encodings || params.encodings.length === 0) {
          params.encodings = [{}];
        }
        params.encodings[0].maxBitrate = this.currentBitrate;
        await sender.setParameters(params);
      }
    }
  }

  getCurrentBitrate(): number {
    return this.currentBitrate;
  }
}

/**
 * Jitter Buffer 설정을 위한 playout delay 힌트 적용
 *
 * RTCRtpReceiver의 playoutDelayHint를 설정하여
 * 수신 측 jitter buffer 크기를 제어합니다.
 */
export function applyJitterBufferConfig(
  pc: RTCPeerConnection,
  targetDelaySeconds = 0.05, // 50ms 기본값 (음악용 저지연)
) {
  const receivers = pc.getReceivers();
  for (const receiver of receivers) {
    if (receiver.track?.kind === "audio") {
      // playoutDelayHint는 아직 표준화 중이지만 Chrome에서 지원
      const jitterBufferTarget = receiver as RTCRtpReceiver & {
        playoutDelayHint?: number;
      };
      if ("playoutDelayHint" in jitterBufferTarget) {
        jitterBufferTarget.playoutDelayHint = targetDelaySeconds;
      }
    }
  }
}
