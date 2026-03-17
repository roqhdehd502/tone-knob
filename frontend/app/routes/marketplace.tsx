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
import { Card, CardContent } from "~/components/ui/card";
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">마켓플레이스</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">프리미엄 타브를 구매하세요</p>
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
                className="group rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-gray-800/80 dark:bg-gray-900 dark:hover:border-violet-700"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                      {(tab.user?.displayName || tab.user?.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {tab.user?.displayName || tab.user?.username}
                    </span>
                  </div>
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <DollarSign className="h-3 w-3" />
                    {tab.price ? formatPrice(tab.price) : "유료"}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-400">
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
                onClick={() => loadTabs(page - 1)}
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
