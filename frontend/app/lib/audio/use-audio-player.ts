import { useState, useCallback, useEffect, useRef } from "react";
import type { TabDocument } from "~/types/tab";
import {
  AudioEngine,
  getAudioEngine,
  type PlaybackState,
  type PlaybackPosition,
} from "./audio-engine";

export interface UseAudioPlayerReturn {
  state: PlaybackState;
  position: PlaybackPosition;
  metronome: boolean;
  play: (startPosition?: PlaybackPosition) => Promise<void>;
  pause: () => void;
  stop: () => void;
  togglePlayPause: () => Promise<void>;
  toggleMetronome: () => void;
  playNotePreview: (stringIndex: number, fret: number) => void;
}

export function useAudioPlayer(tab: TabDocument): UseAudioPlayerReturn {
  const engineRef = useRef<AudioEngine | null>(null);
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const [state, setState] = useState<PlaybackState>("stopped");
  const [position, setPosition] = useState<PlaybackPosition>({
    sectionIndex: 0,
    measureIndex: 0,
    beat: 0,
  });
  const [metronome, setMetronome] = useState(false);

  useEffect(() => {
    const engine = getAudioEngine();
    engineRef.current = engine;

    engine.setCallbacks({
      onStateChange: setState,
      onPositionChange: setPosition,
      onComplete: () => {
        setState("stopped");
        setPosition({ sectionIndex: 0, measureIndex: 0, beat: 0 });
      },
    });

    return () => {
      engine.stop();
    };
  }, []);

  // BPM 변경 시 동기화
  useEffect(() => {
    engineRef.current?.setBpm(tab.bpm);
  }, [tab.bpm]);

  const play = useCallback(
    async (startPosition?: PlaybackPosition) => {
      const engine = engineRef.current;
      if (!engine) return;
      await engine.play(tabRef.current, startPosition);
    },
    [],
  );

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const togglePlayPause = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const currentState = engine.getState();
    if (currentState === "playing") {
      engine.pause();
    } else {
      await engine.play(tabRef.current);
    }
  }, []);

  const toggleMetronome = useCallback(() => {
    setMetronome((prev) => {
      const next = !prev;
      engineRef.current?.setMetronome(next);
      return next;
    });
  }, []);

  const playNotePreview = useCallback(
    (stringIndex: number, fret: number) => {
      engineRef.current?.playNotePreview(
        stringIndex,
        fret,
        tabRef.current.tuning,
      );
    },
    [],
  );

  return {
    state,
    position,
    metronome,
    play,
    pause,
    stop,
    togglePlayPause,
    toggleMetronome,
    playNotePreview,
  };
}
