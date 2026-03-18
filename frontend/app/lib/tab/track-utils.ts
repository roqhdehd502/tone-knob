import type { Track, InstrumentType, TabDocument, Section } from "~/types/tab";
import { STANDARD_TUNING } from "~/types/tab";

const BASS_TUNING = ["G", "D", "A", "E"];

const INSTRUMENT_DEFAULTS: Record<InstrumentType, { tuning: string[]; name: string }> = {
  "electric-guitar": { tuning: [...STANDARD_TUNING], name: "일렉기타" },
  "acoustic-guitar": { tuning: [...STANDARD_TUNING], name: "어쿠스틱기타" },
  bass: { tuning: [...BASS_TUNING], name: "베이스" },
  drums: { tuning: [], name: "드럼" },
  keyboard: { tuning: [], name: "키보드" },
  vocals: { tuning: [], name: "보컬" },
  other: { tuning: [], name: "기타 악기" },
};

export function createTrack(
  instrument: InstrumentType,
  existingSections: Section[],
  customName?: string,
): Track {
  const defaults = INSTRUMENT_DEFAULTS[instrument];
  return {
    id: crypto.randomUUID(),
    name: customName || defaults.name,
    instrument,
    tuning: defaults.tuning,
    isMuted: false,
    volume: 80,
    pan: 0,
    sections: existingSections.map((section) => ({
      id: crypto.randomUUID(),
      name: section.name,
      measures: section.measures.map((measure) => ({
        id: crypto.randomUUID(),
        notes: [],
      })),
    })),
  };
}

export function addTrackToDocument(
  doc: TabDocument,
  instrument: InstrumentType,
  customName?: string,
): TabDocument {
  const newTrack = createTrack(instrument, doc.sections, customName);
  return {
    ...doc,
    tracks: [...(doc.tracks || []), newTrack],
  };
}

export function removeTrackFromDocument(doc: TabDocument, trackId: string): TabDocument {
  return {
    ...doc,
    tracks: (doc.tracks || []).filter((t) => t.id !== trackId),
  };
}

export function updateTrack(
  doc: TabDocument,
  trackId: string,
  updates: Partial<Pick<Track, "name" | "isMuted" | "volume" | "pan">>,
): TabDocument {
  return {
    ...doc,
    tracks: (doc.tracks || []).map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
  };
}

export function getAllTracks(doc: TabDocument): Track[] {
  const mainTrack: Track = {
    id: "main",
    name: "메인 트랙",
    instrument: "electric-guitar",
    tuning: doc.tuning,
    isMuted: false,
    volume: 100,
    pan: 0,
    sections: doc.sections,
  };
  return [mainTrack, ...(doc.tracks || [])];
}

export function getInstrumentLabel(instrument: InstrumentType): string {
  return INSTRUMENT_DEFAULTS[instrument].name;
}

export function getInstrumentIcon(instrument: InstrumentType): string {
  const icons: Record<InstrumentType, string> = {
    "electric-guitar": "🎸",
    "acoustic-guitar": "🎸",
    bass: "🎸",
    drums: "🥁",
    keyboard: "🎹",
    vocals: "🎤",
    other: "🎵",
  };
  return icons[instrument];
}
