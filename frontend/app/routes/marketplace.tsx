import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Eye,
  Flame,
  Heart,
  Loader2,
  ShoppingBag,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "Marketplace - Tone Knob" },
    { name: "description", content: "Tab marketplace" },
  ];
}

type SortOption = "popular" | "oldest" | "newest";

type PaidTab = TabListItem & { price?: number };

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR");
}

export default function Marketplace() {
  const { user } = useAuth();
  const { t, dateLocale } = useI18n();

  const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof Flame }[] = [
    { value: "popular", label: t("marketplace.sort.popular"), icon: Flame },
    { value: "newest", label: t("marketplace.sort.newest"), icon: Clock },
    { value: "oldest", label: t("marketplace.sort.oldest"), icon: ArrowUpDown },
  ];
  const [tabs, setTabs] = useState<PaidTab[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const [purchasedTabs, setPurchasedTabs] = useState<Set<string>>(new Set());
  const [purchasingTabId, setPurchasingTabId] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const loadTabs = useCallback(
    async (p: number, s: SortOption) => {
      setLoading(true);
      try {
        const result = await api.marketplace.listPaidTabs({ page: p, limit: 12, sort: s });
        const data = result.data as PaidTab[];
        setTabs(data);
        setTotal(result.total);
        setPage(p);

        if (user) {
          const ownedFlags = await Promise.all(
            data.map((tab) =>
              api.marketplace.hasPurchased(tab.id).catch(() => ({ purchased: false })),
            ),
          );
          setPurchasedTabs((prev) => {
            const next = new Set(prev);
            data.forEach((tab, i) => {
              if (ownedFlags[i].purchased) next.add(tab.id);
            });
            return next;
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    loadTabs(1, sort);
  }, [loadTabs, sort]);

  const handleSortChange = (s: SortOption) => {
    setSort(s);
    setPage(1);
  };

  const handleBuyClick = async (e: React.MouseEvent, tab: PaidTab) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setPurchaseError(null);
    setPurchasingTabId(tab.id);
    try {
      await api.marketplace.purchase(tab.id);
      setPurchasedTabs((prev) => new Set([...prev, tab.id]));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("marketplace.buyError");
      setPurchaseError(msg);
    } finally {
      setPurchasingTabId(null);
    }
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("marketplace.heading")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("marketplace.subtitle")}
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

      {purchaseError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          {purchaseError}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">{t("marketplace.loading")}</p>
          </CardContent>
        </Card>
      ) : tabs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {t("marketplace.empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tabs.map((tab) => {
              const isPurchased = purchasedTabs.has(tab.id);
              const isPurchasing = purchasingTabId === tab.id;
              return (
                <div key={tab.id} className="group relative">
                  <Link
                    to={`/editor/${tab.id}`}
                    className="block rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-miami-300 hover:shadow-md dark:border-gray-800/80 dark:bg-gray-900 dark:hover:border-miami-700"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-miami-100 text-[10px] font-bold text-miami-600 dark:bg-miami-900/40 dark:text-miami-400">
                          {(tab.user?.displayName || tab.user?.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {tab.user?.displayName || tab.user?.username}
                        </span>
                      </div>
                      {tab.price && tab.price > 0 && (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Coins className="h-3 w-3" />
                          {formatPrice(tab.price)}
                        </span>
                      )}
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
                        {new Date(tab.updatedAt).toLocaleDateString(dateLocale)}
                      </span>
                    </div>
                  </Link>

                  {tab.price && tab.price > 0 && (
                    <button
                      onClick={(e) => handleBuyClick(e, tab)}
                      disabled={isPurchased || isPurchasing}
                      className={`absolute bottom-4 right-4 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isPurchased
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-miami-600 text-white hover:bg-miami-700"
                      }`}
                    >
                      {isPurchased ? (
                        t("marketplace.purchased")
                      ) : isPurchasing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        t("marketplace.buy")
                      )}
                    </button>
                  )}
                </div>
              );
            })}
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
