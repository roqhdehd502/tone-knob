import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  Eye,
  Heart,
  Clock,
  GitFork,
  Globe,
  GlobeLock,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { TabCanvas } from "~/components/editor/TabCanvas";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabDetail, TabVersion } from "~/types/tab";

export function meta() {
  return [{ title: "타브 상세 - Tone Knob" }];
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !tab) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {error || "타브를 찾을 수 없습니다."}
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/tabs">타브 목록으로</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === tab.user?.id;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/tabs"
            className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-violet-500 dark:text-gray-500"
          >
            <ArrowLeft className="h-3 w-3" />
            타브 목록
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {tab.title}
          </h1>
          {tab.artist && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {tab.artist}
            </p>
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
      {tab.content && (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>BPM: {tab.content.bpm}</span>
            <span>
              박자: {tab.content.timeSignature?.[0]}/{tab.content.timeSignature?.[1]}
            </span>
            <span>튜닝: {tab.content.tuning?.join(" ")}</span>
          </div>
        </div>
      )}

      {/* 타브 캔버스 (읽기 전용) */}
      {tab.content?.sections && (
        <div className="overflow-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <TabCanvas
            sections={tab.content.sections}
            tuning={tab.content.tuning || ["E", "B", "G", "D", "A", "E"]}
            selectedNoteIds={new Set()}
            selectedMeasureId={null}
            currentTool="select"
            currentDuration={0.25}
            currentFret={0}
            onNoteClick={() => {}}
            onCellClick={() => {}}
            onMeasureClick={() => {}}
          />
        </div>
      )}

      {/* 버전 히스토리 */}
      <div>
        {!showVersions ? (
          <Button variant="outline" size="sm" onClick={handleLoadVersions}>
            버전 히스토리 보기
          </Button>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              버전 히스토리
            </h3>
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
                      <span className="text-gray-400">
                        {timeAgo(v.createdAt)}
                      </span>
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
          </div>
        )}
      </div>
    </div>
  );
}
