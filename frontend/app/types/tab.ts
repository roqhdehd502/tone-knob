// 타브 문서 전체 구조
export interface TabDocument {
  id?: string;
  title: string;
  artist: string;
  tuning: string[];
  bpm: number;
  timeSignature: [number, number];
  sections: Section[]; // 기본 트랙 (하위 호환)
  tracks?: Track[]; // 멀티트랙 (선택)
}

export interface Section {
  id: string;
  name: string;
  measures: Measure[];
}

export interface Measure {
  id: string;
  notes: Note[];
}

export interface Note {
  id: string;
  string: number; // 0-5 (기타 6줄, 0=1번줄 high E)
  fret: number;
  duration: Duration;
  position: number; // 마디 내 위치 (0~1, beat 기준)
  techniques?: Technique[];
}

export type Duration = 1 | 0.5 | 0.25 | 0.125 | 0.0625; // 온음표~32분음표

export type Technique =
  | "hammer-on"
  | "pull-off"
  | "bend"
  | "slide-up"
  | "slide-down"
  | "vibrato"
  | "mute"
  | "harmonic"
  | "palm-mute"
  | "ghost-note"
  | "let-ring"
  | "tap"
  | "trill"
  | "tremolo-pick"
  | "glissando";

export interface TechniqueMeta {
  id: Technique;
  label: string;
  symbol: string;
  shortcut: string;
  color: string;
}

export const TECHNIQUE_META: TechniqueMeta[] = [
  { id: "hammer-on", label: "해머온", symbol: "H", shortcut: "h", color: "#10b981" },
  { id: "pull-off", label: "풀오프", symbol: "P", shortcut: "p", color: "#3b82f6" },
  { id: "bend", label: "벤딩", symbol: "B", shortcut: "b", color: "#f59e0b" },
  { id: "slide-up", label: "슬라이드↑", symbol: "/", shortcut: "/", color: "#8b5cf6" },
  { id: "slide-down", label: "슬라이드↓", symbol: "\\", shortcut: "\\", color: "#8b5cf6" },
  { id: "vibrato", label: "비브라토", symbol: "~", shortcut: "~", color: "#ec4899" },
  { id: "mute", label: "뮤트", symbol: "X", shortcut: "x", color: "#6b7280" },
  { id: "harmonic", label: "하모닉스", symbol: "◇", shortcut: "o", color: "#06b6d4" },
  { id: "palm-mute", label: "팜뮤트", symbol: "PM", shortcut: "m", color: "#78716c" },
  { id: "ghost-note", label: "고스트노트", symbol: "( )", shortcut: "g", color: "#a1a1aa" },
  { id: "let-ring", label: "렛링", symbol: "LR", shortcut: "l", color: "#14b8a6" },
  { id: "tap", label: "탭핑", symbol: "T", shortcut: "t", color: "#e11d48" },
  { id: "trill", label: "트릴", symbol: "tr", shortcut: "r", color: "#7c3aed" },
  { id: "tremolo-pick", label: "트레몰로", symbol: "≋", shortcut: "w", color: "#ea580c" },
  { id: "glissando", label: "글리산도", symbol: "gl", shortcut: "d", color: "#0284c7" },
];

// 악기 종류
export type InstrumentType =
  | "electric-guitar"
  | "acoustic-guitar"
  | "bass"
  | "drums"
  | "keyboard"
  | "vocals"
  | "other";

// 개별 트랙
export interface Track {
  id: string;
  name: string;
  instrument: InstrumentType;
  tuning: string[];
  isMuted: boolean;
  volume: number; // 0-100
  pan: number; // -100(L) ~ 100(R)
  sections: Section[];
}

// 기본 튜닝
export const STANDARD_TUNING = ["E", "B", "G", "D", "A", "E"];

// 새 빈 문서 생성
export function createEmptyTabDocument(): TabDocument {
  return {
    title: "새 타브",
    artist: "",
    tuning: [...STANDARD_TUNING],
    bpm: 120,
    timeSignature: [4, 4],
    sections: [
      {
        id: crypto.randomUUID(),
        name: "Intro",
        measures: Array.from({ length: 4 }, () => ({
          id: crypto.randomUUID(),
          notes: [],
        })),
      },
    ],
  };
}

// 서버에서 받는 탭 데이터
export interface TabListItem {
  id: string;
  title: string;
  artist: string | null;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface TabDetail extends TabListItem {
  content: TabDocument;
  thumbnailUrl: string | null;
  downloadCount: number;
}

export interface TabVersion {
  id: string;
  versionNumber: number;
  content: TabDocument;
  changeDescription: string | null;
  createdBy: string | null;
  createdAt: string;
  creator?: {
    id: string;
    username: string;
    displayName: string | null;
  };
}

export interface TabListResponse {
  data: TabListItem[];
  total: number;
  page: number;
  limit: number;
}
