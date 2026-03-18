import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Eye, Heart, Clock, GitFork, Globe, GlobeLock, ArrowLeft, Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { TabCanvas } from "~/components/editor/TabCanvas";
import { PlaybackBar } from "~/components/editor/PlaybackBar";
import { useAudioPlayer } from "~/lib/audio/use-audio-player";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabDetail, TabDocument, TabVersion } from "~/types/tab";
import { STANDARD_TUNING } from "~/types/tab";

export function meta() {
  return [{ title: "타브 상세 - Tone Knob" }];
}

const TUNING_PRESETS: Record<string, string[]> = {
  standard: ["E", "B", "G", "D", "A", "E"],
  "drop-d": ["E", "B", "G", "D", "A", "D"],
  "open-g": ["D", "B", "G", "D", "G", "D"],
  dadgad: ["D", "A", "G", "D", "A", "D"],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeContent(raw: any): TabDocument {
  // bpm: legacy uses "tempo"
  const bpm = (raw.bpm ?? raw.tempo ?? 120) as number;

  // timeSignature: legacy uses "4/4" string
  let timeSignature: [number, number] = [4, 4];
  const ts = raw.timeSignature;
  if (Array.isArray(ts) && ts.length >= 2) {
    timeSignature = [Number(ts[0]), Number(ts[1])];
  } else if (typeof ts === "string") {
    const parts = ts.split("/").map(Number);
    if (parts.length === 2 && parts[0] && parts[1]) {
      timeSignature = [parts[0], parts[1]];
    }
  }

  // tuning: legacy uses preset string like "standard"
  let tuning: string[] = [...STANDARD_TUNING];
  if (Array.isArray(raw.tuning)) {
    tuning = raw.tuning as string[];
  } else if (typeof raw.tuning === "string") {
    tuning = TUNING_PRESETS[raw.tuning.toLowerCase()] ?? [...STANDARD_TUNING];
  }

  // sections: legacy uses "tracks" array
  let sections = raw.sections as TabDocument["sections"] | undefined;
  if (!sections && Array.isArray(raw.tracks)) {
    sections = raw.tracks.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (track: any, i: number) => ({
        id: (track.id as string) ?? `track-${i}`,
        name: (track.name as string) ?? (track.instrument as string) ?? `Track ${i + 1}`,
        measures: (track.measures as TabDocument["sections"][0]["measures"]) ?? [],
      }),
    );
  }

  return {
    title: (raw.title as string) ?? "",
    artist: (raw.artist as string) ?? "",
    bpm,
    timeSignature,
    tuning,
    sections: sections ?? [],
  };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export default function TabsDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabDetail | null>(null);
  const [versions, setVersions] = useState<TabVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.tabs
      .get(id)
      .then(setTab)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLoadVersions = async () => {
    if (!id) return;
    setShowVersions(true);
    try {
      const v = await api.tabs.versions(id);
      setVersions(v);
    } catch {
      // ignore
    }
  };

  const handleFork = async () => {
    if (!id || !user) {
      navigate("/login");
      return;
    }
    try {
      const forked = await api.tabs.fork(id);
      navigate(`/tabs/${forked.id}`);
    } catch (err) {
      alert("포크에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-miami-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !tab) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 dark:text-gray-400">{error || "타브를 찾을 수 없습니다."}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/tabs">타브 목록으로</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === tab.user?.id;
  const content = tab.content ? normalizeContent(tab.content) : null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/tabs"
            className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-miami-500 dark:text-gray-500"
          >
            <ArrowLeft className="h-3 w-3" />
            타브 목록
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{tab.title}</h1>
          {tab.artist && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tab.artist}</p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              {tab.isPublic ? (
                <Globe className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <GlobeLock className="h-3.5 w-3.5" />
              )}
              {tab.isPublic ? "공개" : "비공개"}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {tab.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {tab.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(tab.updatedAt)}
            </span>
          </div>
          {tab.user && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              by {tab.user.displayName || tab.user.username}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!isOwner && (
            <Button variant="outline" size="sm" className="gap-1" onClick={handleFork}>
              <GitFork className="h-3.5 w-3.5" />
              포크
            </Button>
          )}
          {isOwner && (
            <Button size="sm" className="gap-1" asChild>
              <Link to={`/editor/${tab.id}`}>
                <Pencil className="h-3.5 w-3.5" />
                편집
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* 타브 정보 */}
      {content && (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>BPM: {content.bpm}</span>
            <span>
              박자: {content.timeSignature[0]}/{content.timeSignature[1]}
            </span>
            <span>튜닝: {content.tuning.join(" ")}</span>
          </div>
        </div>
      )}

      {/* 재생 컨트롤 + 타브 캔버스 (읽기 전용) */}
      {content && content.sections.length > 0 && <TabDetailPlayer content={content} />}

      {/* sections가 없을 때 안내 */}
      {content && content.sections.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">아직 악보 데이터가 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* 버전 히스토리 */}
      <div>
        {!showVersions ? (
          <Button variant="outline" size="sm" onClick={handleLoadVersions}>
            버전 히스토리 보기
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">버전 히스토리</CardTitle>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <p className="text-xs text-gray-400">버전 정보가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-lg border border-gray-100 p-3 text-xs dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          v{v.versionNumber}
                        </span>
                        <span className="text-gray-400">{timeAgo(v.createdAt)}</span>
                      </div>
                      {v.changeDescription && (
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                          {v.changeDescription}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function TabDetailPlayer({ content }: { content: TabDocument }) {
  const player = useAudioPlayer(content);

  return (
    <div className="space-y-3">
      <PlaybackBar
        state={player.state}
        position={player.position}
        bpm={content.bpm}
        metronome={player.metronome}
        instrument={player.instrument}
        volume={player.volume}
        onPlay={() => player.play()}
        onPause={player.pause}
        onStop={player.stop}
        onToggleMetronome={player.toggleMetronome}
        onInstrumentChange={player.setInstrument}
        onVolumeChange={player.setVolume}
      />
      <Card className="overflow-auto p-4">
        <TabCanvas
          sections={content.sections}
          tuning={content.tuning}
          selectedNoteIds={new Set()}
          selectedMeasureId={null}
          currentTool="select"
          currentDuration={0.25}
          currentFret={0}
          onNoteClick={() => {}}
          onCellClick={() => {}}
          onMeasureClick={() => {}}
        />
      </Card>
    </div>
  );
}
