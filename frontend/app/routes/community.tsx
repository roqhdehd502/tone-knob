import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

import { ChevronLeft, ChevronRight, Eye, Heart, Music, Rss, Users } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import { cn } from "~/lib/utils";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [{ title: "Community - Tone Knob" }, { name: "description", content: "Community feed" }];
}

export default function Community() {
  const { user } = useAuth();
  const { t, dateLocale } = useI18n();
  const [feedTabs, setFeedTabs] = useState<TabListItem[]>([]);
  const [exploreTabs, setExploreTabs] = useState<TabListItem[]>([]);
  const [feedTotal, setFeedTotal] = useState(0);
  const [feedPage, setFeedPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"feed" | "explore">("feed");

  const loadFeed = useCallback(
    async (page: number) => {
      if (!user) return;
      setLoading(true);
      try {
        const result = await api.tabs.feed({ page, limit: 12 });
        setFeedTabs(result.data);
        setFeedTotal(result.total);
        setFeedPage(page);
      } catch {
        // 에러 무시
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const loadExplore = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.tabs.list({ limit: 12 });
      setExploreTabs(result.data);
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "feed" && user) {
      loadFeed(1);
    } else {
      loadExplore();
    }
  }, [activeTab, user, loadFeed, loadExplore]);

  const tabs = activeTab === "feed" ? feedTabs : exploreTabs;
  const feedPages = Math.ceil(feedTotal / 12);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="h-16 w-16 text-gray-300 dark:text-gray-700" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          {t("community.heading")}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t("community.loginPrompt")}
        </p>
        <Link to="/login">
          <Button className="mt-4">{t("community.loginBtn")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("community.heading")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("community.subtitle")}</p>
        </div>
        <div className="flex gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          {[
            { key: "feed" as const, icon: Rss, label: t("community.feed") },
            { key: "explore" as const, icon: Music, label: t("community.explore") },
          ].map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setActiveTab(tabItem.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tabItem.key
                  ? "bg-miami-100 text-miami-700 dark:bg-miami-900/40 dark:text-miami-300"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400",
              )}
            >
              <tabItem.icon className="h-3.5 w-3.5" />
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">{t("community.loading")}</p>
          </CardContent>
        </Card>
      ) : tabs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            {activeTab === "feed" ? (
              <>
                <Rss className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {t("community.feedEmpty")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setActiveTab("explore")}
                >
                  {t("community.exploreBtn")}
                </Button>
              </>
            ) : (
              <>
                <Music className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {t("community.exploreEmpty")}
                </p>
              </>
            )}
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
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-miami-100 text-[10px] font-bold text-miami-600 dark:bg-miami-900/40 dark:text-miami-400">
                    {(tab.user?.displayName || tab.user?.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {tab.user?.displayName || tab.user?.username}
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
                    {new Date(tab.updatedAt).toLocaleDateString(dateLocale)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {activeTab === "feed" && feedPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={feedPage <= 1}
                onClick={() => loadFeed(feedPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-500">
                {feedPage} / {feedPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={feedPage >= feedPages}
                onClick={() => loadFeed(feedPage + 1)}
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
