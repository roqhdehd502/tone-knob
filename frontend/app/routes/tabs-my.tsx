import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { Clock, Eye, FileMusic, Globe, GlobeLock, Heart, Plus, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [{ title: "My Tabs - Tone Knob" }, { name: "description", content: "Your created tabs" }];
}

export default function TabsMy() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, dateLocale } = useI18n();
  const [tabs, setTabs] = useState<TabListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 12;

  useEffect(() => {
    if (authLoading) return;
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
  }, [user, authLoading, page, navigate]);

  const totalPages = Math.ceil(total / limit);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("time.justNow");
    if (mins < 60) return t("time.minutesAgo", { n: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("time.hoursAgo", { n: hours });
    const days = Math.floor(hours / 24);
    if (days < 30) return t("time.daysAgo", { n: days });
    return new Date(dateStr).toLocaleDateString(dateLocale);
  }

  const handleDelete = async (tabId: string) => {
    if (!confirm(t("tabsMy.confirmDelete"))) return;
    try {
      await api.tabs.delete(tabId);
      setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
      setTotal((prev) => prev - 1);
    } catch {
      alert(t("tabsMy.deleteError"));
    }
  };

  const handleTogglePublish = async (tabId: string) => {
    try {
      const updated = await api.tabs.togglePublish(tabId);
      setTabs((prev) =>
        prev.map((tab) => (tab.id === tabId ? { ...tab, isPublic: updated.isPublic } : tab)),
      );
    } catch {
      alert(t("tabsMy.visibilityError"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("tabsMy.heading")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("tabsMy.subtitle", { n: total })}
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/editor/new" className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("tabsMy.newTab")}
          </Link>
        </Button>
      </div>

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
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t("tabsMy.noTabs")}</p>
            <Button className="mt-4" size="sm" asChild>
              <Link to="/editor/new">{t("tabsMy.createFirst")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-sm dark:border-gray-800/80 dark:bg-gray-900"
              >
                <Link to={`/tabs/${tab.id}`} className="min-w-0 flex-1 group">
                  <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-miami-700 dark:text-white dark:group-hover:text-miami-300">
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
                    title={tab.isPublic ? t("tabsMy.makePrivate") : t("tabsMy.makePublic")}
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
                    title={t("common.delete")}
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
                {t("common.prev")}
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
                {t("common.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
