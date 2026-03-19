import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  ShoppingBag,
  Eye,
  Heart,
  ChevronLeft,
  ChevronRight,
  Coins,
  Flame,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/lib/api";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "마켓플레이스 - Tone Knob" },
    { name: "description", content: "타브 마켓플레이스" },
  ];
}

type SortOption = "popular" | "oldest" | "newest";

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof Flame }[] = [
  { value: "popular", label: "인기순", icon: Flame },
  { value: "newest", label: "최신순", icon: Clock },
  { value: "oldest", label: "등록순", icon: ArrowUpDown },
];

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR");
}

export default function Marketplace() {
  const [tabs, setTabs] = useState<(TabListItem & { price?: number })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);

  const loadTabs = useCallback(async (p: number, s: SortOption) => {
    setLoading(true);
    try {
      const result = await api.marketplace.listPaidTabs({ page: p, limit: 12, sort: s });
      setTabs(result.data as (TabListItem & { price?: number })[]);
      setTotal(result.total);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabs(1, sort);
  }, [loadTabs, sort]);

  const handleSortChange = (s: SortOption) => {
    setSort(s);
    setPage(1);
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">마켓플레이스</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            프리미엄 타브를 구매하세요
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 dark:border-gray-700/80 dark:bg-gray-900/50">
          {SORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => handleSortChange(opt.value)}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                  sort === opt.value
                    ? "bg-white text-miami-600 shadow-sm dark:bg-gray-800 dark:text-miami-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="h-3 w-3" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">로딩 중...</p>
          </CardContent>
        </Card>
      ) : tabs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              아직 판매 중인 타브가 없습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={`/editor/${tab.id}`}
                className="group rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-miami-300 hover:shadow-md dark:border-gray-800/80 dark:bg-gray-900 dark:hover:border-miami-700"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-miami-100 text-[10px] font-bold text-miami-600 dark:bg-miami-900/40 dark:text-miami-400">
                      {(tab.user?.displayName || tab.user?.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {tab.user?.displayName || tab.user?.username}
                    </span>
                  </div>
                  <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Coins className="h-3 w-3" />
                    {tab.price ? formatPrice(tab.price) : "0"} K
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-miami-600 dark:text-white dark:group-hover:text-miami-400">
                  {tab.title}
                </h3>
                {tab.artist && <p className="mt-0.5 text-xs text-gray-500">{tab.artist}</p>}
                <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-3 w-3" />
                    {tab.viewCount}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Heart className="h-3 w-3" />
                    {tab.likeCount}
                  </span>
                  <span className="ml-auto">
                    {new Date(tab.updatedAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => loadTabs(page - 1, sort)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-500">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => loadTabs(page + 1, sort)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
