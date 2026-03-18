/**
 * useAudioMonitor
 *
 * Web Audio API 기반 오디오 모니터링 훅
 * - 로컬 마이크 입력을 스피커로 출력 (local monitoring / loopback)
 * - 실시간 음량 레벨 (0–1) 측정 (AnalyserNode)
 * - GainNode를 통한 볼륨 제어
 * - AudioContext 옵션(sampleRate, latencyHint)으로 저지연 고품질 지원
 * - 가상 앰프 시뮬레이터 연결/해제 지원
 *
 * MediaStream을 받아서 AudioContext 그래프를 구성합니다.
 * 리모트 스트림에도 동일하게 사용 가능합니다.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { AmpSettings } from "~/lib/jam/amp-simulator";
import { AmpSimulator } from "~/lib/jam/amp-simulator";

export interface AudioMonitorState {
  /** 현재 RMS 음량 레벨 (0–1) */
  level: number;
  /** 모니터링(로컬 출력) 활성 여부 */
  monitoring: boolean;
  /** 현재 gain (0–1) */
  gain: number;
  /** 앰프 시뮬레이터 활성 여부 */
  ampEnabled: boolean;
}

interface AudioMonitorNodes {
  ctx: AudioContext;
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  gainNode: GainNode;
  /** 로컬 모니터링용 destination 연결 여부 */
  monitorConnected: boolean;
}

export function useAudioMonitor() {
  const nodesRef = useRef<AudioMonitorNodes | null>(null);
  const rafRef = useRef<number | null>(null);
  const ampRef = useRef<AmpSimulator>(new AmpSimulator());
  const [state, setState] = useState<AudioMonitorState>({
    level: 0,
    monitoring: false,
    gain: 1,
    ampEnabled: false,
  });

  /**
   * 스트림 연결 — 분석 시작
   * @param stream  MediaStream (getUserMedia 또는 remote)
   * @param enableMonitoring  true이면 즉시 로컬 스피커 출력 (loopback)
   * @param initialGain  초기 gain 값 (0–1), 기본 1
   * @param ctxOptions  AudioContext 생성 옵션 (sampleRate, latencyHint)
   */
  const attach = useCallback(
    (
      stream: MediaStream,
      enableMonitoring = false,
      initialGain = 1,
      ctxOptions?: AudioContextOptions,
    ) => {
      // 기존 연결 정리
      detach();

      // 저지연 AudioContext 생성
      const ctx = new AudioContext({
        sampleRate: ctxOptions?.sampleRate ?? 48000,
        latencyHint: ctxOptions?.latencyHint ?? "interactive",
      });

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;

      const gainNode = ctx.createGain();
      gainNode.gain.value = initialGain;

      // source → analyser (항상 — 레벨 측정용)
      source.connect(analyser);
      // source → gainNode (모니터링 출력용 체인)
      source.connect(gainNode);

      let monitorConnected = false;
      if (enableMonitoring) {
        gainNode.connect(ctx.destination);
        monitorConnected = true;
      }

      nodesRef.current = { ctx, source, analyser, gainNode, monitorConnected };
      setState((s) => ({
        ...s,
        monitoring: enableMonitoring,
        gain: initialGain,
        ampEnabled: false,
      }));

      // 레벨 측정 루프 시작
      startLevelLoop();
    },
    [],
  );

  /** 로컬 모니터링 켜기/끄기 토글 */
  const setMonitoring = useCallback((enabled: boolean) => {
    const nodes = nodesRef.current;
    if (!nodes) return;

    if (enabled && !nodes.monitorConnected) {
      nodes.gainNode.connect(nodes.ctx.destination);
      nodes.monitorConnected = true;
    } else if (!enabled && nodes.monitorConnected) {
      nodes.gainNode.disconnect(nodes.ctx.destination);
      nodes.monitorConnected = false;
    }
    setState((s) => ({ ...s, monitoring: enabled }));
  }, []);

  /** gain 설정 (0–1) */
  const setGain = useCallback((value: number) => {
    const nodes = nodesRef.current;
    if (nodes) {
      nodes.gainNode.gain.value = value;
    }
    setState((s) => ({ ...s, gain: value }));
  }, []);

  /**
   * 앰프 시뮬레이터 연결
   * source → amp → gainNode 으로 체인 재구성
   */
  const connectAmp = useCallback((ampSettings: AmpSettings) => {
    const nodes = nodesRef.current;
    if (!nodes) return;

    const amp = ampRef.current;

    // 기존 source → gainNode 직접 연결 끊기
    try {
      nodes.source.disconnect(nodes.gainNode);
    } catch {
      // 이미 끊어진 경우 무시
    }

    // source → amp → gainNode
    amp.connect(nodes.ctx, nodes.source, nodes.gainNode);
    amp.applySettings(ampSettings);

    setState((s) => ({ ...s, ampEnabled: true }));
  }, []);

  /** 앰프 시뮬레이터 연결 해제 */
  const disconnectAmp = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;

    const amp = ampRef.current;
    amp.disconnect();

    // source → gainNode 직접 연결 복원
    nodes.source.connect(nodes.gainNode);

    setState((s) => ({ ...s, ampEnabled: false }));
  }, []);

  /** 앰프 설정 실시간 업데이트 */
  const updateAmpSettings = useCallback((ampSettings: AmpSettings) => {
    const amp = ampRef.current;
    if (!amp.isConnected()) return;
    amp.applySettings(ampSettings);
  }, []);

  /** 연결 해제 및 정리 */
  const detach = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // 앰프 정리
    ampRef.current.disconnect();
    const nodes = nodesRef.current;
    if (nodes) {
      nodes.source.disconnect();
      nodes.analyser.disconnect();
      nodes.gainNode.disconnect();
      void nodes.ctx.close();
      nodesRef.current = null;
    }
    setState({ level: 0, monitoring: false, gain: 1, ampEnabled: false });
  }, []);

  /** RMS 레벨 측정 루프 */
  const startLevelLoop = useCallback(() => {
    const tick = () => {
      const nodes = nodesRef.current;
      if (!nodes) return;

      const data = new Uint8Array(nodes.analyser.frequencyBinCount);
      nodes.analyser.getByteTimeDomainData(data);

      // RMS 계산
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128; // normalize to [-1, 1]
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      // 0–1 범위로 클램핑 (보통 0.0 ~ 0.7 범위)
      const level = Math.min(1, rms * 2.5);

      setState((s) => {
        // 미세한 변화는 무시하여 불필요한 리렌더 방지
        if (Math.abs(s.level - level) < 0.005) return s;
        return { ...s, level };
      });

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      ampRef.current.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      const nodes = nodesRef.current;
      if (nodes) {
        nodes.source.disconnect();
        nodes.analyser.disconnect();
        nodes.gainNode.disconnect();
        void nodes.ctx.close();
      }
    };
  }, []);

  return {
    ...state,
    attach,
    detach,
    setMonitoring,
    setGain,
    connectAmp,
    disconnectAmp,
    updateAmpSettings,
  };
}
