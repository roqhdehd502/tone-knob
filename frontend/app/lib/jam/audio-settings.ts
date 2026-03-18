/**
 * Audio Settings
 *
 * 합주방 오디오 설정 관리
 * - 입출력 장치 선택
 * - 오디오 품질 설정 (sampleRate, latency, 프로세싱 옵션)
 * - 오디오 인터페이스 지원
 * - localStorage 영속 저장
 */

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: "audioinput" | "audiooutput";
}

export interface AudioSettings {
  /** 입력(마이크/오디오 인터페이스) 장치 ID */
  inputDeviceId: string;
  /** 출력(스피커/헤드폰) 장치 ID */
  outputDeviceId: string;
  /** 샘플레이트 (Hz) */
  sampleRate: 44100 | 48000 | 96000;
  /** 버퍼 크기 — AudioContext latencyHint에 매핑 */
  bufferSize: "interactive" | "balanced" | "playback";
  /** 에코 캔슬레이션 (일반 마이크용, 오디오 인터페이스에서는 OFF 권장) */
  echoCancellation: boolean;
  /** 노이즈 서프레션 (음악 시 OFF 권장) */
  noiseSuppression: boolean;
  /** 자동 게인 컨트롤 (음악 시 OFF 권장) */
  autoGainControl: boolean;
  /** 모노/스테레오 */
  channelCount: 1 | 2;
}

const STORAGE_KEY = "tone-knob:audio-settings";

const DEFAULT_SETTINGS: AudioSettings = {
  inputDeviceId: "default",
  outputDeviceId: "default",
  sampleRate: 48000,
  bufferSize: "interactive",
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 1,
};

/** 저장된 설정 로드 (없으면 기본값) */
export function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // 파싱 실패 시 기본값
  }
  return { ...DEFAULT_SETTINGS };
}

/** 설정 저장 */
export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 저장 실패 무시
  }
}

/** 기본값 반환 */
export function getDefaultSettings(): AudioSettings {
  return { ...DEFAULT_SETTINGS };
}

/** 사용 가능한 오디오 장치 목록 조회 */
export async function listAudioDevices(): Promise<AudioDevice[]> {
  try {
    // 권한이 없으면 label이 빈 문자열 — 먼저 임시 스트림으로 권한 확보
    let tempStream: MediaStream | null = null;
    try {
      tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // 권한 거부 시에도 deviceId는 조회 가능
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices: AudioDevice[] = devices
      .filter((d) => d.kind === "audioinput" || d.kind === "audiooutput")
      .map((d) => ({
        deviceId: d.deviceId,
        label:
          d.label ||
          (d.kind === "audioinput"
            ? `마이크 ${d.deviceId.slice(0, 6)}`
            : `스피커 ${d.deviceId.slice(0, 6)}`),
        kind: d.kind as "audioinput" | "audiooutput",
      }));

    // 임시 스트림 정리
    if (tempStream) {
      tempStream.getTracks().forEach((t) => t.stop());
    }

    return audioDevices;
  } catch {
    return [];
  }
}

/** 설정 기반으로 getUserMedia constraints 생성 */
export function buildMediaConstraints(settings: AudioSettings): MediaStreamConstraints {
  return {
    audio: {
      deviceId:
        settings.inputDeviceId !== "default" ? { exact: settings.inputDeviceId } : undefined,
      sampleRate: { ideal: settings.sampleRate },
      channelCount: { ideal: settings.channelCount },
      echoCancellation: { ideal: settings.echoCancellation },
      noiseSuppression: { ideal: settings.noiseSuppression },
      autoGainControl: { ideal: settings.autoGainControl },
    },
  };
}

/** 설정 기반으로 AudioContext 옵션 생성 */
export function buildAudioContextOptions(settings: AudioSettings): AudioContextOptions {
  return {
    sampleRate: settings.sampleRate,
    latencyHint: settings.bufferSize,
  };
}

/** 출력 장치를 HTMLAudioElement 또는 AudioContext에 적용 */
export async function setOutputDevice(
  element: HTMLAudioElement | HTMLMediaElement,
  deviceId: string,
): Promise<void> {
  if (deviceId === "default") return;
  try {
    // setSinkId는 Chrome/Edge 등에서 지원
    const el = element as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
    if (el.setSinkId) {
      await el.setSinkId(deviceId);
    }
  } catch (e) {
    console.warn("[AudioSettings] Failed to set output device:", e);
  }
}

/** 버퍼 크기 라벨 */
export const BUFFER_SIZE_OPTIONS: {
  value: AudioSettings["bufferSize"];
  label: string;
  desc: string;
}[] = [
  { value: "interactive", label: "저지연 (Interactive)", desc: "최소 레이턴시, CPU 사용 높음" },
  { value: "balanced", label: "균형 (Balanced)", desc: "적당한 레이턴시와 CPU 사용" },
  { value: "playback", label: "안정 (Playback)", desc: "높은 레이턴시, 안정적 재생" },
];

/** 샘플레이트 옵션 */
export const SAMPLE_RATE_OPTIONS: { value: AudioSettings["sampleRate"]; label: string }[] = [
  { value: 44100, label: "44.1 kHz (CD 품질)" },
  { value: 48000, label: "48 kHz (권장)" },
  { value: 96000, label: "96 kHz (고품질)" },
];
