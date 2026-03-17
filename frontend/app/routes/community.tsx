import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  Users,
  Rss,
  Music,
  Eye,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "커뮤니티 - Tone Knob" },
    { name: "description", content: "커뮤니티 피드" },
  ];
}

export default function Community() {
  const { user } = useAuth();
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
          커뮤니티
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          로그인하면 팔로우한 뮤지션들의 타브를 확인할 수 있습니다.
        </p>
        <Link to="/login">
          <Button className="mt-4">로그인</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          커뮤니티
        </h1>
        <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "feed"
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <Rss className="h-4 w-4" />
            피드
          </button>
          <button
            onClick={() => setActiveTab("explore")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "explore"
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <Music className="h-4 w-4" />
            탐색
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">로딩 중...</p>
        </div>
      ) : tabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {activeTab === "feed" ? (
            <>
              <Rss className="h-12 w-12 text-gray-300 dark:text-gray-700" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                팔로우한 뮤지션의 타브가 여기에 표시됩니다.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setActiveTab("explore")}
              >
                타브 탐색하기
              </Button>
            </>
          ) : (
            <>
              <Music className="h-12 w-12 text-gray-300 dark:text-gray-700" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                아직 공개된 타브가 없습니다.
              </p>
            </>
          )}
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
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/30" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {tab.user?.displayName || tab.user?.username}
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

          {activeTab === "feed" && feedPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={feedPage <= 1}
                onClick={() => loadFeed(feedPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">
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
