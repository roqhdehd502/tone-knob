import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  ShoppingBag,
  Store,
  Eye,
  Heart,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/api";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "마켓플레이스 - Tone Knob" },
    { name: "description", content: "타브 마켓플레이스" },
  ];
}

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

export default function Marketplace() {
  const [tabs, setTabs] = useState<(TabListItem & { price?: number })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadTabs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await api.marketplace.listPaidTabs({ page: p, limit: 12 });
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
    loadTabs(1);
  }, [loadTabs]);

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Store className="h-7 w-7 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          마켓플레이스
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">로딩 중...</p>
        </div>
      ) : tabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-300 dark:text-gray-700" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            아직 판매 중인 타브가 없습니다.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={`/editor/${tab.id}`}
                className="group rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/30" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {tab.user?.displayName || tab.user?.username}
                    </span>
                  </div>
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <DollarSign className="h-3 w-3" />
                    {tab.price ? formatPrice(tab.price) : "유료"}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-400">
                  {tab.title}
                </h3>
                {tab.artist && (
                  <p className="mt-0.5 text-sm text-gray-500">{tab.artist}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {tab.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
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
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => loadTabs(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => loadTabs(page + 1)}
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
