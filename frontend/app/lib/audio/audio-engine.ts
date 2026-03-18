import * as Tone from "tone";

import type { Duration, InstrumentType, TabDocument } from "~/types/tab";

// 표준 튜닝의 MIDI 노트 번호 (1번줄 high E → 6번줄 low E)
const STANDARD_TUNING_MIDI = [64, 59, 55, 50, 45, 40]; // E4, B3, G3, D3, A2, E2

// 노트 이름 매핑
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G]#?)(\d)?$/);
  if (!match) return 64;
  const noteName = match[1];
  const octave = match[2] ? parseInt(match[2]) : 4;
  const noteIndex = NOTE_NAMES.indexOf(noteName);
  if (noteIndex === -1) return 64;
  return (octave + 1) * 12 + noteIndex;
}

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

// Duration 값을 Tone.js notation으로 변환
function durationToNotation(duration: Duration): string {
  const abs = Math.abs(duration);
  switch (abs) {
    case 1:
      return "1n";
    case 0.75:
      return "2n.";
    case 0.5:
      return "2n";
    case 0.375:
      return "4n.";
    case 0.25:
      return "4n";
    case 0.1875:
      return "8n.";
    case 0.125:
      return "8n";
    case 0.0625:
      return "16n";
    case 0.03125:
      return "32n";
    default:
      return "4n";
  }
}

export type PlaybackState = "stopped" | "playing" | "paused";

export interface PlaybackPosition {
  sectionIndex: number;
  measureIndex: number;
  beat: number; // 0-based beat within measure
}

export interface AudioEngineCallbacks {
  onPositionChange?: (position: PlaybackPosition) => void;
  onStateChange?: (state: PlaybackState) => void;
  onComplete?: () => void;
}

// Instrument-specific synth configurations
function createInstrumentSynth(instrument: InstrumentType): Tone.PolySynth {
  switch (instrument) {
    case "electric-guitar":
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "fatsawtooth", spread: 12, count: 3 },
        envelope: {
          attack: 0.003,
          decay: 0.4,
          sustain: 0.15,
          release: 1.2,
        },
        volume: -8,
      });
    case "acoustic-guitar":
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle8" },
        envelope: {
          attack: 0.002,
          decay: 0.6,
          sustain: 0.08,
          release: 1.5,
        },
        volume: -6,
      });
    case "bass":
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "fmsine", modulationIndex: 1.5 },
        envelope: {
          attack: 0.01,
          decay: 0.5,
          sustain: 0.3,
          release: 0.8,
        },
        volume: -4,
      });
    case "keyboard":
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.6,
          release: 0.6,
        },
        volume: -6,
      });
    default:
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.005,
          decay: 0.3,
          sustain: 0.2,
          release: 0.8,
        },
        volume: -6,
      });
  }
}

export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private metronomeSynth: Tone.MembraneSynth | null = null;
  private reverbNode: Tone.Reverb | null = null;
  private eqNode: Tone.EQ3 | null = null;
  private volumeNode: Tone.Volume | null = null;
  private scheduledEvents: number[] = [];
  private state: PlaybackState = "stopped";
  private callbacks: AudioEngineCallbacks = {};
  private metronomeEnabled = false;
  private animationFrameId: number | null = null;
  private startTime = 0;
  private pauseOffset = 0;
  private currentInstrument: InstrumentType = "electric-guitar";

  async init(instrument?: InstrumentType): Promise<void> {
    await Tone.start();

    if (instrument) {
      this.currentInstrument = instrument;
    }

    // Dispose old chain
    this.synth?.dispose();
    this.reverbNode?.dispose();
    this.eqNode?.dispose();
    this.volumeNode?.dispose();

    // Create instrument-specific synth
    this.synth = createInstrumentSynth(this.currentInstrument);

    // FX chain: synth → EQ → reverb → volume → destination
    this.volumeNode = new Tone.Volume(0).toDestination();
    this.reverbNode = new Tone.Reverb({ decay: 1.5, wet: 0.15 }).connect(this.volumeNode);
    this.eqNode = new Tone.EQ3({
      low: this.currentInstrument === "bass" ? 3 : 0,
      mid: 0,
      high: this.currentInstrument === "acoustic-guitar" ? 2 : 0,
    }).connect(this.reverbNode);

    this.synth.connect(this.eqNode);

    this.metronomeSynth = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 4,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
      },
      volume: -12,
    }).toDestination();
  }

  async setInstrument(instrument: InstrumentType): Promise<void> {
    if (this.currentInstrument === instrument && this.synth) return;
    this.currentInstrument = instrument;
    await this.init(instrument);
  }

  getInstrument(): InstrumentType {
    return this.currentInstrument;
  }

  setVolume(db: number): void {
    if (this.volumeNode) {
      this.volumeNode.volume.value = db;
    }
  }

  setCallbacks(callbacks: AudioEngineCallbacks): void {
    this.callbacks = callbacks;
  }

  getState(): PlaybackState {
    return this.state;
  }

  // 기타 줄과 프렛으로부터 실제 음 높이 계산
  getNoteFrequency(stringIndex: number, fret: number, tuning: string[]): string {
    let baseMidi: number;
    if (tuning.length > stringIndex) {
      // 튜닝 문자열에 옥타브 번호가 없으면 표준 옥타브 사용
      const tuningNote = tuning[stringIndex];
      if (/\d/.test(tuningNote)) {
        baseMidi = noteNameToMidi(tuningNote);
      } else {
        baseMidi = STANDARD_TUNING_MIDI[stringIndex] ?? 64;
        // 표준 튜닝과 다른 경우 보정
        const stdNote = NOTE_NAMES[STANDARD_TUNING_MIDI[stringIndex] % 12];
        const curNote = tuningNote;
        if (stdNote !== curNote) {
          const stdIdx = NOTE_NAMES.indexOf(stdNote);
          const curIdx = NOTE_NAMES.indexOf(curNote);
          if (stdIdx !== -1 && curIdx !== -1) {
            baseMidi += curIdx - stdIdx;
          }
        }
      }
    } else {
      baseMidi = STANDARD_TUNING_MIDI[stringIndex] ?? 64;
    }

    return midiToNoteName(baseMidi + fret);
  }

  // 단일 음 재생 (미리듣기용)
  playNotePreview(
    stringIndex: number,
    fret: number,
    tuning: string[],
    duration: Duration = 0.25,
  ): void {
    if (!this.synth) return;
    const noteName = this.getNoteFrequency(stringIndex, fret, tuning);
    const notation = durationToNotation(duration);
    this.synth.triggerAttackRelease(noteName, notation);
  }

  // 전체 타브 재생
  async play(tab: TabDocument, startPosition?: PlaybackPosition): Promise<void> {
    if (!this.synth) await this.init();
    if (this.state === "playing") return;

    const bpm = tab.bpm;
    Tone.getTransport().bpm.value = bpm;

    if (this.state === "paused") {
      // Resume from pause
      Tone.getTransport().start(undefined, `+${this.pauseOffset}`);
      this.setState("playing");
      this.startPositionTracking(tab);
      return;
    }

    // Clear previous
    this.stop();
    Tone.getTransport().bpm.value = bpm;

    const beatsPerMeasure = tab.timeSignature[0];
    const secondsPerBeat = 60 / bpm;
    let globalTime = 0;

    // Starting position offset
    const startSectionIdx = startPosition?.sectionIndex ?? 0;
    const startMeasureIdx = startPosition?.measureIndex ?? 0;

    for (let si = startSectionIdx; si < tab.sections.length; si++) {
      const section = tab.sections[si];
      const mStart = si === startSectionIdx ? startMeasureIdx : 0;

      for (let mi = mStart; mi < section.measures.length; mi++) {
        const measure = section.measures[mi];
        const measureDuration = beatsPerMeasure * secondsPerBeat;

        // Schedule metronome clicks
        if (this.metronomeEnabled) {
          for (let beat = 0; beat < beatsPerMeasure; beat++) {
            const clickTime = globalTime + beat * secondsPerBeat;
            const eventId = Tone.getTransport().schedule((time) => {
              this.metronomeSynth?.triggerAttackRelease(beat === 0 ? "C3" : "C2", "32n", time);
            }, clickTime);
            this.scheduledEvents.push(eventId);
          }
        }

        // Schedule notes
        for (const note of measure.notes) {
          const noteTime = globalTime + note.position * measureDuration;
          const noteName = this.getNoteFrequency(note.string, note.fret, tab.tuning);
          const notation = durationToNotation(note.duration);

          const eventId = Tone.getTransport().schedule((time) => {
            this.synth?.triggerAttackRelease(noteName, notation, time);
          }, noteTime);
          this.scheduledEvents.push(eventId);
        }

        globalTime += measureDuration;
      }
    }

    // Schedule end
    const endId = Tone.getTransport().schedule(() => {
      this.stop();
      this.callbacks.onComplete?.();
    }, globalTime);
    this.scheduledEvents.push(endId);

    this.startTime = Tone.now();
    this.pauseOffset = 0;
    Tone.getTransport().start();
    this.setState("playing");
    this.startPositionTracking(tab);
  }

  pause(): void {
    if (this.state !== "playing") return;
    this.pauseOffset = Tone.getTransport().seconds;
    Tone.getTransport().pause();
    this.setState("paused");
    this.stopPositionTracking();
  }

  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    this.scheduledEvents = [];
    this.pauseOffset = 0;
    this.setState("stopped");
    this.stopPositionTracking();
    this.callbacks.onPositionChange?.({
      sectionIndex: 0,
      measureIndex: 0,
      beat: 0,
    });
  }

  setMetronome(enabled: boolean): void {
    this.metronomeEnabled = enabled;
  }

  isMetronomeEnabled(): boolean {
    return this.metronomeEnabled;
  }

  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm;
  }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.metronomeSynth?.dispose();
    this.reverbNode?.dispose();
    this.eqNode?.dispose();
    this.volumeNode?.dispose();
    this.synth = null;
    this.metronomeSynth = null;
    this.reverbNode = null;
    this.eqNode = null;
    this.volumeNode = null;
  }

  private setState(state: PlaybackState): void {
    this.state = state;
    this.callbacks.onStateChange?.(state);
  }

  private startPositionTracking(tab: TabDocument): void {
    this.stopPositionTracking();

    const beatsPerMeasure = tab.timeSignature[0];
    const secondsPerBeat = 60 / tab.bpm;
    const measureDuration = beatsPerMeasure * secondsPerBeat;

    // Build measure time map
    const measureMap: { sectionIndex: number; measureIndex: number; startTime: number }[] = [];
    let t = 0;
    for (let si = 0; si < tab.sections.length; si++) {
      for (let mi = 0; mi < tab.sections[si].measures.length; mi++) {
        measureMap.push({ sectionIndex: si, measureIndex: mi, startTime: t });
        t += measureDuration;
      }
    }

    const tick = () => {
      if (this.state !== "playing") return;
      const elapsed = Tone.getTransport().seconds;

      // Find current measure
      let current = measureMap[0];
      for (const m of measureMap) {
        if (m.startTime <= elapsed) current = m;
        else break;
      }

      if (current) {
        const beatInMeasure = (elapsed - current.startTime) / secondsPerBeat;
        this.callbacks.onPositionChange?.({
          sectionIndex: current.sectionIndex,
          measureIndex: current.measureIndex,
          beat: Math.min(beatInMeasure, beatsPerMeasure),
        });
      }

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stopPositionTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

// Singleton
let engineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!engineInstance) {
    engineInstance = new AudioEngine();
  }
  return engineInstance;
}
