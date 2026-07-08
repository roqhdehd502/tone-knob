import { useEffect, useState } from "react";
import { Link } from "react-router";

import {
  ArrowRight,
  Clock,
  Eye,
  FileMusic,
  Heart,
  Plus,
  Radio,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useI18n } from "~/context/i18n";
import type { MessageKey } from "~/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "Tone Knob - Tab Creator & Jam Platform" },
    {
      name: "description",
      content: "Tab creation and real-time online jam platform for music lovers",
    },
  ];
}

export default function Home() {
  const { user } = useAuth();
  const { t, dateLocale } = useI18n();
  const [publicTabs, setPublicTabs] = useState<TabListItem[]>([]);
  const [myTabs, setMyTabs] = useState<TabListItem[]>([]);
  const [publicTotal, setPublicTotal] = useState(0);

  useEffect(() => {
    api.tabs
      .list({ limit: 6 })
      .then((res) => {
        setPublicTabs(res.data);
        setPublicTotal(res.total);
      })
      .catch(() => {});

    if (user) {
      api.tabs
        .my({ limit: 4 })
        .then((res) => setMyTabs(res.data))
        .catch(() => {});
    }
  }, [user]);

  const stats = [
    { label: t("home.statsPublicTabs"), value: String(publicTotal), icon: FileMusic },
    { label: t("home.statsActiveJam"), value: "0", icon: Radio },
    { label: t("home.statsMembers"), value: "0", icon: Users },
    { label: t("home.statsWeeklyActivity"), value: "0", icon: TrendingUp },
  ];

  const quickLinks = [
    {
      to: "/editor/new",
      icon: FileMusic,
      title: t("home.quickTabCreate"),
      desc: t("home.quickTabCreateDesc"),
    },
    {
      to: "/jamroom",
      icon: Radio,
      title: t("home.quickJam"),
      desc: t("home.quickJamDesc"),
    },
    {
      to: "/community",
      icon: Users,
      title: t("home.quickCommunity"),
      desc: t("home.quickCommunityDesc"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-miami-600 via-miami-600 to-rosewood-700 p-6 text-white shadow-lg shadow-miami-500/10 sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-miami-200">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {user
                ? t("home.welcomeUser", { name: user.displayName || user.username })
                : t("home.brandName")}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{t("home.tagline")}</h1>
          <p className="mt-2 max-w-lg text-sm text-white/70">{t("home.subtitle")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-miami-700 hover:bg-white/90">
              <Link to="/editor/new" className="gap-2">
                <Plus className="h-4 w-4" />
                {t("home.newTab")}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Link to="/tabs" className="gap-2">
                {t("home.exploreTabs")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-miami-50 dark:bg-miami-950/50">
                <stat.icon className="h-4 w-4 text-miami-600 dark:text-miami-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 내 타브 */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">{t("home.myTabs")}</CardTitle>
            {user && myTabs.length > 0 && (
              <Link
                to="/tabs/my"
                className="flex items-center gap-1 text-xs text-miami-600 hover:underline dark:text-miami-400"
              >
                {t("home.viewAll")} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {!user ? (
              <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4 text-center dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("home.noMyTabsLogin")}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">{t("home.loginBtn")}</Link>
                </Button>
              </div>
            ) : myTabs.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4 text-center dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("home.noMyTabs")}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/editor/new">{t("home.createTab")}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {myTabs.map((tab) => (
                  <TabListCard key={tab.id} tab={tab} dateLocale={dateLocale} t={t} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 인기 합주방 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("home.popularJam")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4 text-center dark:border-gray-800">
              <Radio className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("home.noJamRooms")}</p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/jamroom">{t("home.browseJams")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 공개 타브 */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">{t("home.recentPublicTabs")}</CardTitle>
          {publicTabs.length > 0 && (
            <Link
              to="/tabs"
              className="flex items-center gap-1 text-xs text-miami-600 hover:underline dark:text-miami-400"
            >
              {t("home.viewAll")} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {publicTabs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
              <FileMusic className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t("home.noPublicTabs")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {publicTabs.map((tab) => (
                <TabListCard key={tab.id} tab={tab} showAuthor dateLocale={dateLocale} t={t} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 빠른 시작 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-miami-300 hover:shadow-md dark:border-gray-800/80 dark:bg-gray-900 dark:hover:border-miami-700"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-miami-50 transition-colors group-hover:bg-miami-100 dark:bg-miami-950/50 dark:group-hover:bg-miami-950">
              <item.icon className="h-5 w-5 text-miami-600 dark:text-miami-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

type TFn = (key: MessageKey, params?: Record<string, string | number>) => string;

function timeAgo(dateStr: string, t: TFn, dateLocale: string) {
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

function TabListCard({
  tab,
  showAuthor = false,
  dateLocale,
  t,
}: {
  tab: TabListItem;
  showAuthor?: boolean;
  dateLocale: string;
  t: TFn;
}) {
  return (
    <Link
      to={`/tabs/${tab.id}`}
      className="group block rounded-lg border border-gray-100 p-3 transition-colors hover:border-miami-200 hover:bg-miami-50/50 dark:border-gray-800 dark:hover:border-miami-800 dark:hover:bg-miami-950/30"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-miami-700 dark:text-white dark:group-hover:text-miami-300">
            {tab.title}
          </h3>
          {tab.artist && (
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{tab.artist}</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
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
          {timeAgo(tab.updatedAt, t, dateLocale)}
        </span>
      </div>
      {showAuthor && tab.user && (
        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          by {tab.user.displayName || tab.user.username}
        </p>
      )}
    </Link>
  );
}
