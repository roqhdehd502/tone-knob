import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Search,
  Eye,
  Heart,
  Clock,
  Plus,
  FileMusic,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/lib/api";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "타브 탐색 - Tone Knob" },
    { name: "description", content: "공개된 타브를 탐색하세요" },
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

export default function Tabs() {
  const [tabs, setTabs] = useState<TabListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    api.tabs
      .list({ page, limit, search: search || undefined })
      .then((res) => {
        setTabs(res.data);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            타브 탐색
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {total}개의 공개 타브
          </p>
        </div>
        <Button asChild>
          <Link to="/editor/new" className="gap-2">
            <Plus className="h-4 w-4" />새 타브
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="타브 제목 또는 아티스트 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : tabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileMusic className="h-16 w-16 text-gray-300 dark:text-gray-700" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {search
              ? `"${search}"에 대한 검색 결과가 없습니다.`
              : "아직 공개된 타브가 없습니다."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={`/tabs/${tab.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-violet-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-700"
              >
                <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                  {tab.title}
                </h3>
                {tab.artist && (
                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                    {tab.artist}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
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
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    by {tab.user.displayName || tab.user.username}
                  </p>
                )}
              </Link>
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
