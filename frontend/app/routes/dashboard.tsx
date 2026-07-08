import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { Calendar, Clock, Flame, Music, TrendingUp } from "lucide-react";

import { PageLoader } from "~/components/common/PageLoader";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";

export function meta() {
  return [
    { title: "Dashboard - Tone Knob" },
    { name: "description", content: "Practice statistics dashboard" },
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

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [loading, setLoading] = useState(true);

  function formatMinutes(minutes: number): string {
    if (minutes < 60) return t("dashboard.timeMinutes", { n: minutes });
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? t("dashboard.timeHoursMinutes", { h, m }) : t("dashboard.timeHours", { h });
  }

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
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("dashboard.heading")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("dashboard.subtitle")}</p>
      </div>

      {!stats || stats.totalSessions === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Music className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.noStats")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<Clock className="h-4 w-4 text-blue-500" />}
              label={t("dashboard.totalTime")}
              value={formatMinutes(stats.totalMinutes)}
            />
            <StatCard
              icon={<Music className="h-4 w-4 text-emerald-500" />}
              label={t("dashboard.totalSessions")}
              value={t("dashboard.sessions", { n: stats.totalSessions })}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
              label={t("dashboard.avgSession")}
              value={formatMinutes(stats.averageSessionMinutes)}
            />
            <StatCard
              icon={<Calendar className="h-4 w-4 text-miami-500" />}
              label={t("dashboard.thisWeek")}
              value={formatMinutes(stats.thisWeekMinutes)}
            />
            <StatCard
              icon={<Calendar className="h-4 w-4 text-pink-500" />}
              label={t("dashboard.thisMonth")}
              value={formatMinutes(stats.thisMonthMinutes)}
            />
            <StatCard
              icon={<Flame className="h-4 w-4 text-orange-500" />}
              label={t("dashboard.streak")}
              value={t("dashboard.days", { n: stats.streak })}
              highlight={stats.streak >= 7}
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("dashboard.weeklyGoalTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-2xl font-bold text-miami-600 dark:text-miami-400">
                  {formatMinutes(stats.thisWeekMinutes)}
                </span>
                <span className="text-sm text-gray-400">{t("dashboard.weeklyGoalTarget")}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-linear-to-r from-miami-500 to-miami-500 transition-all"
                  style={{ width: `${Math.min(100, (stats.thisWeekMinutes / 300) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {stats.thisWeekMinutes >= 300
                  ? t("dashboard.goalAchieved")
                  : t("dashboard.goalRemaining", {
                      time: formatMinutes(300 - stats.thisWeekMinutes),
                    })}
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
