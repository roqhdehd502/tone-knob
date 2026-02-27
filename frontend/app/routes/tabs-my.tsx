import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Eye,
  Heart,
  Clock,
  Plus,
  FileMusic,
  Globe,
  GlobeLock,
  Trash2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "내 타브 - Tone Knob" },
    { name: "description", content: "내가 만든 타브 목록" },
  ];
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

export default function TabsMy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<TabListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 12;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setLoading(true);
    api.tabs
      .my({ page, limit })
      .then((res) => {
        setTabs(res.data);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, page, navigate]);

  const totalPages = Math.ceil(total / limit);

  const handleDelete = async (tabId: string) => {
    if (!confirm("정말 이 타브를 삭제하시겠습니까?")) return;
    try {
      await api.tabs.delete(tabId);
      setTabs((prev) => prev.filter((t) => t.id !== tabId));
      setTotal((prev) => prev - 1);
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleTogglePublish = async (tabId: string) => {
    try {
      const updated = await api.tabs.togglePublish(tabId);
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, isPublic: updated.isPublic } : t)),
      );
    } catch {
      alert("공개 설정 변경에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            내 타브
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {total}개의 타브
          </p>
        </div>
        <Button asChild>
          <Link to="/editor/new" className="gap-2">
            <Plus className="h-4 w-4" />새 타브
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : tabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileMusic className="h-16 w-16 text-gray-300 dark:text-gray-700" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            아직 제작한 타브가 없습니다.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/editor/new">첫 타브 만들기</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <Link
                  to={`/tabs/${tab.id}`}
                  className="min-w-0 flex-1 group"
                >
                  <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                    {tab.title}
                  </h3>
                  {tab.artist && (
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      {tab.artist}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {tab.viewCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" />
                      {tab.likeCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {timeAgo(tab.updatedAt)}
                    </span>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(tab.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    title={tab.isPublic ? "비공개로 전환" : "공개로 전환"}
                  >
                    {tab.isPublic ? (
                      <Globe className="h-4 w-4 text-green-500" />
                    ) : (
                      <GlobeLock className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tab.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
