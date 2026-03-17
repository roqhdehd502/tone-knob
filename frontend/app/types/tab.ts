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
  | "harmonic";

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
