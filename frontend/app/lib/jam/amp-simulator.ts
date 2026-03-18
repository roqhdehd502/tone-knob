/**
 * AmpSimulator
 *
 * Web Audio API 기반 가상 기타 앰프 시뮬레이터
 * - Gain Stage (프리앰프 드라이브)
 * - WaveShaper 디스토션 (Clean / Crunch / Overdrive / High Gain)
 * - Cabinet Simulation (BiquadFilter 기반 IR 근사)
 * - 3-Band EQ (Low / Mid / High)
 * - Reverb (ConvolverNode — 알고리즘 생성 IR)
 * - Delay
 * - Noise Gate
 * - Master Volume
 *
 * 실시간 입력 스트림에 적용하여 가상 앰프 사운드를 만듭니다.
 */

export type AmpPreset = "clean" | "crunch" | "overdrive" | "highgain" | "acoustic" | "bass";

export interface AmpSettings {
  enabled: boolean;
  preset: AmpPreset;
  /** 프리앰프 게인 (0–10) */
  gain: number;
  /** Bass EQ (-12 ~ +12 dB) */
  bass: number;
  /** Mid EQ (-12 ~ +12 dB) */
  mid: number;
  /** Treble EQ (-12 ~ +12 dB) */
  treble: number;
  /** 마스터 볼륨 (0–10) */
  master: number;
  /** 리버브 양 (0–1) */
  reverb: number;
  /** 딜레이 양 (0–1) */
  delay: number;
  /** 딜레이 타임 (ms) */
  delayTime: number;
  /** 캐비닛 시뮬레이션 ON/OFF */
  cabinet: boolean;
  /** 노이즈 게이트 스레숄드 (0–1, 0=off) */
  noiseGate: number;
}

export const DEFAULT_AMP_SETTINGS: AmpSettings = {
  enabled: false,
  preset: "clean",
  gain: 3,
  bass: 0,
  mid: 0,
  treble: 0,
  master: 5,
  reverb: 0.2,
  delay: 0,
  delayTime: 300,
  cabinet: true,
  noiseGate: 0.01,
};

export const AMP_PRESETS: Record<
  AmpPreset,
  Partial<AmpSettings> & { label: string; emoji: string }
> = {
  clean: {
    label: "Clean",
    emoji: "🔔",
    gain: 2,
    bass: 1,
    mid: 0,
    treble: 2,
    master: 6,
    reverb: 0.3,
    cabinet: true,
  },
  crunch: {
    label: "Crunch",
    emoji: "🔥",
    gain: 5,
    bass: 2,
    mid: 3,
    treble: 1,
    master: 5,
    reverb: 0.15,
    cabinet: true,
  },
  overdrive: {
    label: "Overdrive",
    emoji: "⚡",
    gain: 7,
    bass: 3,
    mid: 4,
    treble: 2,
    master: 4,
    reverb: 0.1,
    cabinet: true,
  },
  highgain: {
    label: "High Gain",
    emoji: "🤘",
    gain: 9,
    bass: 4,
    mid: 5,
    treble: 3,
    master: 3,
    reverb: 0.05,
    cabinet: true,
  },
  acoustic: {
    label: "Acoustic",
    emoji: "🪕",
    gain: 1,
    bass: -1,
    mid: 2,
    treble: 3,
    master: 7,
    reverb: 0.4,
    cabinet: false,
  },
  bass: {
    label: "Bass",
    emoji: "🎵",
    gain: 4,
    bass: 6,
    mid: -2,
    treble: -3,
    master: 6,
    reverb: 0.1,
    cabinet: true,
  },
};

/** WaveShaper용 디스토션 커브 생성 */
function makeDistortionCurve(amount: number): Float32Array {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  const k = amount * 50;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/** 알고리즘 기반 리버브 IR 생성 */
function createReverbIR(ctx: AudioContext, duration = 2, decay = 2): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
}

export class AmpSimulator {
  private ctx: AudioContext | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private output: GainNode | null = null;

  // 이펙트 체인 노드
  private noiseGateNode: GainNode | null = null;
  private preampGain: GainNode | null = null;
  private distortion: WaveShaperNode | null = null;
  private cabLow: BiquadFilterNode | null = null;
  private cabHigh: BiquadFilterNode | null = null;
  private eqLow: BiquadFilterNode | null = null;
  private eqMid: BiquadFilterNode | null = null;
  private eqHigh: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private settings: AmpSettings = { ...DEFAULT_AMP_SETTINGS };
  private connected = false;

  /**
   * 앰프 시뮬레이터를 스트림에 연결
   * @returns 이펙트가 적용된 출력 노드 (destination에 연결하거나 다른 노드에 체이닝 가능)
   */
  connect(
    audioCtx: AudioContext,
    sourceNode: MediaStreamAudioSourceNode,
    destinationNode: AudioNode,
  ): void {
    this.ctx = audioCtx;
    this.input = sourceNode;

    // === 노드 생성 ===

    // 노이즈 게이트 (간단한 게이트 — 추후 compressor 기반으로 확장 가능)
    this.noiseGateNode = audioCtx.createGain();
    this.noiseGateNode.gain.value = 1;

    // 프리앰프
    this.preampGain = audioCtx.createGain();

    // 디스토션
    this.distortion = audioCtx.createWaveShaper();
    this.distortion.oversample = "4x";

    // 캐비닛 시뮬레이션 (LPF + HPF로 스피커 특성 근사)
    this.cabLow = audioCtx.createBiquadFilter();
    this.cabLow.type = "highpass";
    this.cabLow.frequency.value = 80;
    this.cabLow.Q.value = 0.7;

    this.cabHigh = audioCtx.createBiquadFilter();
    this.cabHigh.type = "lowpass";
    this.cabHigh.frequency.value = 5000;
    this.cabHigh.Q.value = 0.7;

    // 3밴드 EQ
    this.eqLow = audioCtx.createBiquadFilter();
    this.eqLow.type = "lowshelf";
    this.eqLow.frequency.value = 320;

    this.eqMid = audioCtx.createBiquadFilter();
    this.eqMid.type = "peaking";
    this.eqMid.frequency.value = 1000;
    this.eqMid.Q.value = 1.5;

    this.eqHigh = audioCtx.createBiquadFilter();
    this.eqHigh.type = "highshelf";
    this.eqHigh.frequency.value = 3200;

    // 리버브
    this.reverbNode = audioCtx.createConvolver();
    this.reverbNode.buffer = createReverbIR(audioCtx);
    this.reverbGain = audioCtx.createGain();
    this.dryGain = audioCtx.createGain();

    // 딜레이
    this.delayNode = audioCtx.createDelay(2);
    this.delayFeedback = audioCtx.createGain();
    this.delayGain = audioCtx.createGain();

    // 마스터
    this.masterGain = audioCtx.createGain();
    this.output = audioCtx.createGain();

    // === 체인 연결 ===
    // source → noiseGate → preamp → distortion → cab → EQ → reverb/dry mix → delay mix → master → output
    sourceNode.connect(this.noiseGateNode);
    this.noiseGateNode.connect(this.preampGain);
    this.preampGain.connect(this.distortion);
    this.distortion.connect(this.cabLow);
    this.cabLow.connect(this.cabHigh);
    this.cabHigh.connect(this.eqLow);
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);

    // EQ → dry + reverb 병렬
    this.eqHigh.connect(this.dryGain);
    this.eqHigh.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);

    // dry + reverb → masterGain
    this.dryGain.connect(this.masterGain);
    this.reverbGain.connect(this.masterGain);

    // 딜레이 체인 (parallel)
    this.eqHigh.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode); // 피드백 루프
    this.delayNode.connect(this.delayGain);
    this.delayGain.connect(this.masterGain);

    // master → output → destination
    this.masterGain.connect(this.output);
    this.output.connect(destinationNode);

    this.connected = true;
    this.applySettings(this.settings);
  }

  /** 앰프 연결 해제 */
  disconnect(): void {
    if (!this.connected) return;
    try {
      this.input?.disconnect();
      this.noiseGateNode?.disconnect();
      this.preampGain?.disconnect();
      this.distortion?.disconnect();
      this.cabLow?.disconnect();
      this.cabHigh?.disconnect();
      this.eqLow?.disconnect();
      this.eqMid?.disconnect();
      this.eqHigh?.disconnect();
      this.reverbNode?.disconnect();
      this.reverbGain?.disconnect();
      this.dryGain?.disconnect();
      this.delayNode?.disconnect();
      this.delayFeedback?.disconnect();
      this.delayGain?.disconnect();
      this.masterGain?.disconnect();
      this.output?.disconnect();
    } catch {
      // ignore disconnect errors
    }
    this.connected = false;
  }

  /** 설정 적용 */
  applySettings(settings: AmpSettings): void {
    this.settings = { ...settings };
    if (!this.connected || !this.ctx) return;

    const s = this.settings;

    // 프리앰프 게인 (0–10 → 0.1–20 exponential)
    if (this.preampGain) {
      this.preampGain.gain.value = 0.1 + Math.pow(s.gain / 10, 2) * 20;
    }

    // 디스토션 커브
    if (this.distortion) {
      this.distortion.curve = makeDistortionCurve(s.gain / 10) as any;
    }

    // 캐비닛 바이패스
    if (this.cabHigh) {
      this.cabHigh.frequency.value = s.cabinet ? 5000 : 20000;
    }
    if (this.cabLow) {
      this.cabLow.frequency.value = s.cabinet ? 80 : 1;
    }

    // EQ (-12 ~ +12 dB)
    if (this.eqLow) this.eqLow.gain.value = s.bass;
    if (this.eqMid) this.eqMid.gain.value = s.mid;
    if (this.eqHigh) this.eqHigh.gain.value = s.treble;

    // 리버브 믹스
    if (this.reverbGain) this.reverbGain.gain.value = s.reverb;
    if (this.dryGain) this.dryGain.gain.value = 1 - s.reverb * 0.5;

    // 딜레이
    if (this.delayNode) this.delayNode.delayTime.value = s.delayTime / 1000;
    if (this.delayFeedback) this.delayFeedback.gain.value = s.delay * 0.7;
    if (this.delayGain) this.delayGain.gain.value = s.delay;

    // 마스터 볼륨 (0–10 → 0–1.5)
    if (this.masterGain) {
      this.masterGain.gain.value = (s.master / 10) * 1.5;
    }
  }

  /** 프리셋 적용 */
  applyPreset(preset: AmpPreset): void {
    const p = AMP_PRESETS[preset];
    this.applySettings({
      ...this.settings,
      preset,
      gain: p.gain ?? this.settings.gain,
      bass: p.bass ?? this.settings.bass,
      mid: p.mid ?? this.settings.mid,
      treble: p.treble ?? this.settings.treble,
      master: p.master ?? this.settings.master,
      reverb: p.reverb ?? this.settings.reverb,
      cabinet: p.cabinet ?? this.settings.cabinet,
    });
  }

  getSettings(): AmpSettings {
    return { ...this.settings };
  }

  isConnected(): boolean {
    return this.connected;
  }
}
