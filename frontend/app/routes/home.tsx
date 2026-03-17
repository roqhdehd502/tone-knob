import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  FileMusic,
  Radio,
  Users,
  TrendingUp,
  Plus,
  Eye,
  Heart,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "Tone Knob - 타브 제작 & 실시간 합주 플랫폼" },
    {
      name: "description",
      content: "음악을 사랑하는 사람들을 위한 타브 제작 및 실시간 온라인 합주 플랫폼",
    },
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

export default function Home() {
  const { user } = useAuth();
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
    { label: "공개 타브", value: String(publicTotal), icon: FileMusic },
    { label: "활성 합주방", value: "0", icon: Radio },
    { label: "커뮤니티 멤버", value: "0", icon: Users },
    { label: "이번 주 활동", value: "0", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 text-white shadow-lg shadow-violet-500/10 sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-violet-200">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {user ? `${user.displayName || user.username}님, 환영합니다` : "Tone Knob"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">음악을 만들고, 함께 연주하세요</h1>
          <p className="mt-2 max-w-lg text-sm text-white/70">
            타브 제작부터 실시간 합주까지 — 당신의 음악 여정이 여기서 시작됩니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-violet-700 hover:bg-white/90">
              <Link to="/editor/new" className="gap-2">
                <Plus className="h-4 w-4" />새 타브 만들기
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Link to="/tabs" className="gap-2">
                타브 둘러보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/50">
                <stat.icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
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
            <CardTitle className="text-base">내 타브</CardTitle>
            {user && myTabs.length > 0 && (
              <Link
                to="/tabs/my"
                className="flex items-center gap-1 text-xs text-violet-600 hover:underline dark:text-violet-400"
              >
                전체 보기 <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {!user ? (
              <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4 text-center dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  로그인하면 내 타브를 확인할 수 있습니다.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">로그인</Link>
                </Button>
              </div>
            ) : myTabs.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4 text-center dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  아직 제작한 타브가 없습니다.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/editor/new">타브 만들기</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {myTabs.map((tab) => (
                  <TabListCard key={tab.id} tab={tab} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 인기 합주방 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">인기 합주방</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4 text-center dark:border-gray-800">
              <Radio className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                현재 활성화된 합주방이 없습니다.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/jamroom">합주방 둘러보기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 공개 타브 */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">최근 공개 타브</CardTitle>
          {publicTabs.length > 0 && (
            <Link
              to="/tabs"
              className="flex items-center gap-1 text-xs text-violet-600 hover:underline dark:text-violet-400"
            >
              전체 보기 <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {publicTabs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
              <FileMusic className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                아직 공개된 타브가 없습니다. 타브를 만들어 공유해보세요!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {publicTabs.map((tab) => (
                <TabListCard key={tab.id} tab={tab} showAuthor />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 빠른 시작 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            to: "/editor/new",
            icon: FileMusic,
            title: "타브 만들기",
            desc: "직관적인 에디터로 쉽게 악보를 제작하세요",
          },
          {
            to: "/jamroom",
            icon: Radio,
            title: "합주 시작",
            desc: "친구들과 실시간으로 합주를 즐기세요",
          },
          {
            to: "/community",
            icon: Users,
            title: "커뮤니티",
            desc: "다른 뮤지션들의 타브를 탐색하세요",
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-gray-800/80 dark:bg-gray-900 dark:hover:border-violet-700"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 transition-colors group-hover:bg-violet-100 dark:bg-violet-950/50 dark:group-hover:bg-violet-950">
              <item.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
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

function TabListCard({ tab, showAuthor = false }: { tab: TabListItem; showAuthor?: boolean }) {
  return (
    <Link
      to={`/tabs/${tab.id}`}
      className="group block rounded-lg border border-gray-100 p-3 transition-colors hover:border-violet-200 hover:bg-violet-50/50 dark:border-gray-800 dark:hover:border-violet-800 dark:hover:bg-violet-950/30"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
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
          {timeAgo(tab.updatedAt)}
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
