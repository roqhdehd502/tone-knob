import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Clock, Eye, FileMusic, Heart, Plus, Search } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">타브 탐색</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{total}개의 공개 타브</p>
        </div>
        <Button asChild size="sm">
          <Link to="/editor/new" className="gap-1.5">
            <Plus className="h-4 w-4" />새 타브
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
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
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-miami-500 border-t-transparent" />
          </CardContent>
        </Card>
      ) : tabs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileMusic className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {search ? `"${search}"에 대한 검색 결과가 없습니다.` : "아직 공개된 타브가 없습니다."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={`/tabs/${tab.id}`}
                className="group rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-miami-300 hover:shadow-md dark:border-gray-800/80 dark:bg-gray-900 dark:hover:border-miami-700"
              >
                <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-miami-700 dark:text-white dark:group-hover:text-miami-300">
                  {tab.title}
                </h3>
                {tab.artist && (
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {tab.artist}
                  </p>
                )}
                <div className="mt-2.5 flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
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
                {tab.user && (
                  <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
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
              <span className="text-xs text-gray-500 dark:text-gray-400">
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
