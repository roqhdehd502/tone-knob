/**
 * AudioSynchronizer
 *
 * 합주방에서 모든 참가자의 오디오 재생을 동기화합니다.
 * - 지연시간 보정: 서버 RTT 기반으로 재생 시점 보정
 * - 재생 동기화: 호스트가 재생/정지/이동 시 모든 참가자에게 전파
 * - AudioContext 기반 정밀 타이밍 제어
 */

export interface SyncState {
  isPlaying: boolean;
  position: number;
  bpm: number;
  startedAt: number;
  serverTimeDelta: number;
}

export class AudioSynchronizer {
  private audioContext: AudioContext | null = null;
  private state: SyncState = {
    isPlaying: false,
    position: 0,
    bpm: 120,
    startedAt: 0,
    serverTimeDelta: 0,
  };
  private latencySamples: number[] = [];
  private onStateChange?: (state: SyncState) => void;

  constructor(bpm: number = 120) {
    this.state.bpm = bpm;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  setOnStateChange(callback: (state: SyncState) => void) {
    this.onStateChange = callback;
  }

  /**
   * 지연시간 샘플 추가 (RTT / 2 = 편도 지연)
   */
  addLatencySample(rttMs: number) {
    this.latencySamples.push(rttMs / 2);
    // 최근 10개만 유지
    if (this.latencySamples.length > 10) {
      this.latencySamples.shift();
    }
  }

  /**
   * 평균 편도 지연시간 (ms)
   */
  getEstimatedLatency(): number {
    if (this.latencySamples.length === 0) return 0;
    // 중앙값 사용 (이상치 제거)
    const sorted = [...this.latencySamples].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * 재생 시작 (호스트가 발행)
   */
  play(position: number = this.state.position) {
    this.state.isPlaying = true;
    this.state.position = position;
    this.state.startedAt = this.now();
    this.onStateChange?.(this.getState());
  }

  /**
   * 재생 중지
   */
  pause() {
    if (this.state.isPlaying) {
      this.state.position = this.getCurrentPosition();
      this.state.isPlaying = false;
      this.onStateChange?.(this.getState());
    }
  }

  /**
   * 위치 이동
   */
  seek(position: number) {
    this.state.position = position;
    if (this.state.isPlaying) {
      this.state.startedAt = this.now();
    }
    this.onStateChange?.(this.getState());
  }

  /**
   * 원격 동기화 수신 (다른 참가자의 재생 상태를 적용)
   */
  applyRemoteSync(data: { position: number; isPlaying: boolean; timestamp?: number }) {
    const latency = this.getEstimatedLatency();

    if (data.isPlaying) {
      // 지연시간을 보정하여 재생 위치 조정
      const elapsedSinceEmit = latency; // ms
      const beatsPerMs = this.state.bpm / 60 / 1000;
      const correctedPosition = data.position + elapsedSinceEmit * beatsPerMs;

      this.state.isPlaying = true;
      this.state.position = correctedPosition;
      this.state.startedAt = this.now();
    } else {
      this.state.isPlaying = false;
      this.state.position = data.position;
    }

    this.onStateChange?.(this.getState());
  }

  /**
   * 현재 재생 위치 계산 (비트 단위)
   */
  getCurrentPosition(): number {
    if (!this.state.isPlaying) {
      return this.state.position;
    }

    const elapsed = this.now() - this.state.startedAt;
    const beatsPerMs = this.state.bpm / 60 / 1000;
    return this.state.position + elapsed * beatsPerMs;
  }

  /**
   * BPM 변경
   */
  setBpm(bpm: number) {
    if (this.state.isPlaying) {
      this.state.position = this.getCurrentPosition();
      this.state.startedAt = this.now();
    }
    this.state.bpm = bpm;
    this.onStateChange?.(this.getState());
  }

  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * 고정밀 현재 시각 (ms)
   */
  private now(): number {
    if (this.audioContext) {
      return this.audioContext.currentTime * 1000;
    }
    return performance.now();
  }

  dispose() {
    if (this.audioContext && this.audioContext.state !== "closed") {
      void this.audioContext.close();
    }
    this.audioContext = null;
    this.latencySamples = [];
  }
}
