import { useState, useCallback, useEffect, useRef } from "react";
import type { TabDocument, InstrumentType } from "~/types/tab";
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
  instrument: InstrumentType;
  volume: number;
  play: (startPosition?: PlaybackPosition) => Promise<void>;
  pause: () => void;
  stop: () => void;
  togglePlayPause: () => Promise<void>;
  toggleMetronome: () => void;
  setInstrument: (instrument: InstrumentType) => Promise<void>;
  setVolume: (volume: number) => void;
  playNotePreview: (stringIndex: number, fret: number) => void;
}

// Detect instrument from TabDocument
function detectInstrument(tab: TabDocument): InstrumentType {
  if (tab.tracks && tab.tracks.length > 0) {
    return tab.tracks[0].instrument;
  }
  // Heuristic: check tuning for bass (4 strings typically)
  if (tab.tuning.length === 4) return "bass";
  return "electric-guitar";
}

export function useAudioPlayer(tab: TabDocument): UseAudioPlayerReturn {
  const engineRef = useRef<AudioEngine | null>(null);
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const detectedInstrument = detectInstrument(tab);
  const [state, setState] = useState<PlaybackState>("stopped");
  const [position, setPosition] = useState<PlaybackPosition>({
    sectionIndex: 0,
    measureIndex: 0,
    beat: 0,
  });
  const [metronome, setMetronome] = useState(false);
  const [instrument, setInstrumentState] = useState<InstrumentType>(detectedInstrument);
  const [volume, setVolumeState] = useState(80); // 0-100

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

    // Init with detected instrument
    engine.setInstrument(detectedInstrument);

    return () => {
      engine.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // BPM 변경 시 동기화
  useEffect(() => {
    engineRef.current?.setBpm(tab.bpm);
  }, [tab.bpm]);

  const play = useCallback(async (startPosition?: PlaybackPosition) => {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.play(tabRef.current, startPosition);
  }, []);

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

  const setInstrument = useCallback(async (inst: InstrumentType) => {
    setInstrumentState(inst);
    await engineRef.current?.setInstrument(inst);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    // Convert 0-100 linear to dB (-40 to 0)
    const db = vol <= 0 ? -Infinity : (vol / 100) * 40 - 40;
    engineRef.current?.setVolume(db);
  }, []);

  const playNotePreview = useCallback((stringIndex: number, fret: number) => {
    engineRef.current?.playNotePreview(stringIndex, fret, tabRef.current.tuning);
  }, []);

  return {
    state,
    position,
    metronome,
    instrument,
    volume,
    play,
    pause,
    stop,
    togglePlayPause,
    toggleMetronome,
    setInstrument,
    setVolume,
    playNotePreview,
  };
}
