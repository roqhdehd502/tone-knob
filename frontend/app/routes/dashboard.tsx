import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  BarChart3,
  Clock,
  Flame,
  Music,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";

export function meta() {
  return [
    { title: "통계 대시보드 - Tone Knob" },
    { name: "description", content: "연습 통계 대시보드" },
  ];
}

interface PracticeStats {
  totalSessions: number;
  totalMinutes: number;
  averageSessionMinutes: number;
  thisWeekMinutes: number;
  thisMonthMinutes: number;
  streak: number;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    api.practice
      .getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          통계 대시보드
        </h1>
      </div>

      {!stats || stats.totalSessions === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-center dark:border-gray-800 dark:bg-gray-900">
          <Music className="h-12 w-12 text-gray-300 dark:text-gray-700" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            아직 연습 기록이 없습니다. 타브를 열고 연습을 시작해보세요!
          </p>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<Clock className="h-5 w-5 text-blue-500" />}
              label="총 연습 시간"
              value={formatMinutes(stats.totalMinutes)}
            />
            <StatCard
              icon={<Music className="h-5 w-5 text-emerald-500" />}
              label="총 세션"
              value={`${stats.totalSessions}회`}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
              label="평균 세션 시간"
              value={formatMinutes(stats.averageSessionMinutes)}
            />
            <StatCard
              icon={<Calendar className="h-5 w-5 text-violet-500" />}
              label="이번 주"
              value={formatMinutes(stats.thisWeekMinutes)}
            />
            <StatCard
              icon={<Calendar className="h-5 w-5 text-pink-500" />}
              label="이번 달"
              value={formatMinutes(stats.thisMonthMinutes)}
            />
            <StatCard
              icon={<Flame className="h-5 w-5 text-orange-500" />}
              label="연속 연습"
              value={`${stats.streak}일`}
              highlight={stats.streak >= 7}
            />
          </div>

          {/* 주간 목표 프로그레스 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              주간 연습 목표
            </h2>
            <div className="mb-2 flex items-end justify-between">
              <span className="text-2xl font-bold text-violet-600">
                {formatMinutes(stats.thisWeekMinutes)}
              </span>
              <span className="text-sm text-gray-400">/ 목표 5시간</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all"
                style={{
                  width: `${Math.min(100, (stats.thisWeekMinutes / 300) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {stats.thisWeekMinutes >= 300
                ? "이번 주 목표를 달성했습니다!"
                : `${formatMinutes(300 - stats.thisWeekMinutes)} 더 연습하면 목표 달성!`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-900/20"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
