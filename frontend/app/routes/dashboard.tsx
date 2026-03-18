import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BarChart3, Clock, Flame, Music, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
        <Loader2 className="h-8 w-8 animate-spin text-miami-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">통계 대시보드</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          연습 기록과 통계를 확인하세요
        </p>
      </div>

      {!stats || stats.totalSessions === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Music className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              아직 연습 기록이 없습니다. 타브를 열고 연습을 시작해보세요!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<Clock className="h-4 w-4 text-blue-500" />}
              label="총 연습 시간"
              value={formatMinutes(stats.totalMinutes)}
            />
            <StatCard
              icon={<Music className="h-4 w-4 text-emerald-500" />}
              label="총 세션"
              value={`${stats.totalSessions}회`}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
              label="평균 세션 시간"
              value={formatMinutes(stats.averageSessionMinutes)}
            />
            <StatCard
              icon={<Calendar className="h-4 w-4 text-miami-500" />}
              label="이번 주"
              value={formatMinutes(stats.thisWeekMinutes)}
            />
            <StatCard
              icon={<Calendar className="h-4 w-4 text-pink-500" />}
              label="이번 달"
              value={formatMinutes(stats.thisMonthMinutes)}
            />
            <StatCard
              icon={<Flame className="h-4 w-4 text-orange-500" />}
              label="연속 연습"
              value={`${stats.streak}일`}
              highlight={stats.streak >= 7}
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">주간 연습 목표</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-2xl font-bold text-miami-600 dark:text-miami-400">
                  {formatMinutes(stats.thisWeekMinutes)}
                </span>
                <span className="text-sm text-gray-400">/ 목표 5시간</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-linear-to-r from-miami-500 to-miami-500 transition-all"
                  style={{ width: `${Math.min(100, (stats.thisWeekMinutes / 300) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {stats.thisWeekMinutes >= 300
                  ? "이번 주 목표를 달성했습니다! 🎉"
                  : `${formatMinutes(300 - stats.thisWeekMinutes)} 더 연습하면 목표 달성!`}
              </p>
            </CardContent>
          </Card>
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
    <Card
      className={
        highlight
          ? "border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20"
          : ""
      }
    >
      <div className="p-4">
        <div className="mb-1.5 flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        </div>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </Card>
  );
}
