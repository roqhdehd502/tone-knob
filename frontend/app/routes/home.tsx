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
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "Tone Knob - 타브 제작 & 실시간 합주 플랫폼" },
    {
      name: "description",
      content:
        "음악을 사랑하는 사람들을 위한 타브 제작 및 실시간 온라인 합주 플랫폼",
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            대시보드
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tone Knob에 오신 것을 환영합니다
          </p>
        </div>
        <Button asChild>
          <Link to="/editor/new" className="gap-2">
            <Plus className="h-4 w-4" />새 타브
          </Link>
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
                <stat.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 내 타브 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              내 타브
            </h2>
            {user && myTabs.length > 0 && (
              <Link
                to="/tabs/my"
                className="text-xs text-violet-600 hover:underline dark:text-violet-400"
              >
                전체 보기
              </Link>
            )}
          </div>
          {!user ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                로그인하면 내 타브를 확인할 수 있습니다.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">로그인</Link>
              </Button>
            </div>
          ) : myTabs.length === 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                아직 제작한 타브가 없습니다. 새 타브를 만들어보세요!
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/editor/new">타브 만들기</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {myTabs.map((tab) => (
                <TabListCard key={tab.id} tab={tab} />
              ))}
            </div>
          )}
        </div>

        {/* 인기 합주방 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            인기 합주방
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            현재 활성화된 합주방이 없습니다. 새 합주방을 열어보세요!
          </p>
          <Button variant="outline" className="mt-4" size="sm" asChild>
            <Link to="/jamroom">합주방 둘러보기</Link>
          </Button>
        </div>
      </div>

      {/* 공개 타브 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            최근 공개 타브
          </h2>
          {publicTabs.length > 0 && (
            <Link
              to="/tabs"
              className="text-xs text-violet-600 hover:underline dark:text-violet-400"
            >
              전체 보기
            </Link>
          )}
        </div>
        {publicTabs.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            아직 공개된 타브가 없습니다. 타브를 만들어 공유해보세요!
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicTabs.map((tab) => (
              <TabListCard key={tab.id} tab={tab} showAuthor />
            ))}
          </div>
        )}
      </div>

      {/* 빠른 시작 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          빠른 시작
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/editor/new"
            className="group flex flex-col items-center rounded-lg border border-gray-200 p-6 text-center transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:hover:border-violet-700 dark:hover:bg-violet-950"
          >
            <FileMusic className="h-8 w-8 text-gray-400 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            <h3 className="mt-3 font-medium text-gray-900 dark:text-white">
              타브 만들기
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              드래그 앤 드롭으로 쉽게 타브를 제작하세요
            </p>
          </Link>

          <Link
            to="/jamroom"
            className="group flex flex-col items-center rounded-lg border border-gray-200 p-6 text-center transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:hover:border-violet-700 dark:hover:bg-violet-950"
          >
            <Radio className="h-8 w-8 text-gray-400 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            <h3 className="mt-3 font-medium text-gray-900 dark:text-white">
              합주 시작
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              친구들과 실시간으로 합주를 즐기세요
            </p>
          </Link>

          <Link
            to="/community"
            className="group flex flex-col items-center rounded-lg border border-gray-200 p-6 text-center transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:hover:border-violet-700 dark:hover:bg-violet-950"
          >
            <Users className="h-8 w-8 text-gray-400 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            <h3 className="mt-3 font-medium text-gray-900 dark:text-white">
              커뮤니티
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              다른 뮤지션들의 타브를 탐색하세요
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function TabListCard({
  tab,
  showAuthor = false,
}: {
  tab: TabListItem;
  showAuthor?: boolean;
}) {
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
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              {tab.artist}
            </p>
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
