import { Bot, CreditCard, Headphones, Music, TrendingUp, Users, Video } from "lucide-react";

import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { StatsCard } from "~/components/ui/StatsCard";
import { useI18n } from "~/context/i18n";
import { requireAdmin } from "~/service/session.server";
import type { StatsPeriod } from "~/service/stats.server";
import { getDashboardStats, getRecentTabs, getRecentUsers } from "~/service/stats.server";

import type { Route } from "./+types/dashboard";

/** 브라우저 탭 제목 메타 */
export function meta() {
  return [{ title: "Dashboard - Tone Knob Admin" }];
}

/**
 * 대시보드 데이터 로더.
 * URL 쿼리 파라미터 `period`로 통계 기간을 선택하며 기본값은 `"7d"`이다.
 * 통계·최근 사용자·최근 타브를 병렬로 조회한다.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "7d") as StatsPeriod;

  const [stats, recentUsers, recentTabs] = await Promise.all([
    getDashboardStats(period),
    getRecentUsers(8),
    getRecentTabs(8),
  ]);
  return { admin, stats, recentUsers, recentTabs, period };
}

/** 기간 선택 버튼에 표시할 StatsPeriod 순서 */
const PERIOD_KEYS: StatsPeriod[] = ["today", "7d", "30d", "all"];

/**
 * 대시보드 페이지 컴포넌트.
 * 기간 선택 탭, 주요 지표 카드 그리드, AI 작업 요약, 최근 사용자/타브 테이블을 렌더링한다.
 */
export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { admin, stats, recentUsers, recentTabs, period } = loaderData;
  const { t } = useI18n();

  /** StatsPeriod 값을 현재 로케일에 맞는 레이블 문자열로 변환한다 */
  const periodLabel = (v: StatsPeriod): string => {
    if (v === "today") return t("period.today");
    if (v === "7d") return t("period.7d");
    if (v === "30d") return t("period.30d");
    return t("period.all");
  };

  return (
    <>
      <Topbar
        adminName={admin.adminName}
        adminEmail={admin.adminEmail}
        title={t("dashboard.pageTitle")}
      />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4 lg:space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t("period.label")}</span>
            <div className="flex rounded-lg border border-slate-200 bg-white text-sm">
              {PERIOD_KEYS.map((v, i) => (
                <a
                  key={v}
                  href={`/?period=${v}`}
                  className={`px-3 py-1.5 transition-colors ${
                    period === v ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  } ${i === 0 ? "rounded-l-lg" : i === PERIOD_KEYS.length - 1 ? "rounded-r-lg" : ""}`}
                >
                  {periodLabel(v)}
                </a>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatsCard
              title={t("dashboard.totalUsers")}
              value={stats.users.total}
              icon={Users}
              iconColor="text-blue-600"
              trend={{
                value: stats.users.newInPeriod,
                label: t("dashboard.newInPeriod", { period: stats.periodLabel }),
              }}
            />
            <StatsCard
              title={t("dashboard.totalTabs")}
              value={stats.tabs.total}
              icon={Music}
              iconColor="text-violet-600"
              trend={{
                value: stats.tabs.newInPeriod,
                label: t("dashboard.newInPeriod", { period: stats.periodLabel }),
              }}
            />
            <StatsCard
              title={t("dashboard.activeSubscriptions")}
              value={stats.subscriptions.active}
              icon={CreditCard}
              iconColor="text-emerald-600"
              sub={t("dashboard.activeStatus")}
            />
            <StatsCard
              title={t("dashboard.activeJamRooms")}
              value={stats.jamRooms.active}
              icon={Headphones}
              iconColor="text-orange-500"
              sub={t("dashboard.currentlyActive")}
            />
            <StatsCard
              title={t("dashboard.totalRecordings")}
              value={stats.recordings.total}
              icon={Video}
              iconColor="text-pink-600"
            />
            <StatsCard
              title={t("dashboard.completedPayments")}
              value={stats.payments.completed}
              icon={TrendingUp}
              iconColor="text-teal-600"
            />
          </div>

          {/* AI Job summary */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href="/ai-jobs?status=queued"
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100 transition-colors"
            >
              <div className="rounded-lg bg-amber-100 p-2">
                <Bot className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {t("dashboard.aiQueuedJobs")}
                </p>
                <p className="text-2xl font-bold text-amber-800">{stats.aiJobs.queued}</p>
              </div>
            </a>
            <a
              href="/ai-jobs?status=failed"
              className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 hover:bg-red-100 transition-colors"
            >
              <div className="rounded-lg bg-red-100 p-2">
                <Bot className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900">{t("dashboard.aiFailedJobs")}</p>
                <p className="text-2xl font-bold text-red-800">{stats.aiJobs.failed}</p>
              </div>
            </a>
          </div>

          {/* Recent Data Tables */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Recent Users */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  {t("dashboard.recentUsers")}
                </h2>
                <a href="/users" className="text-xs font-medium text-blue-600 hover:underline">
                  {t("common.viewAll")}
                </a>
              </div>
              <div className="divide-y divide-slate-50">
                {recentUsers.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-400">{t("dashboard.noUsers")}</p>
                ) : (
                  recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {user.displayName || user.username}
                        </p>
                        <p className="truncate text-xs text-slate-400">{user.email}</p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        {user.role === "admin" && <Badge variant="danger">admin</Badge>}
                        {user.role === "banned" && (
                          <Badge variant="warning">{t("dashboard.suspended")}</Badge>
                        )}
                        <Badge
                          variant={
                            user.subscriptionTier === "pro"
                              ? "info"
                              : user.subscriptionTier === "premium"
                                ? "success"
                                : "default"
                          }
                        >
                          {user.subscriptionTier}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Tabs */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  {t("dashboard.recentTabs")}
                </h2>
                <a href="/tabs" className="text-xs font-medium text-blue-600 hover:underline">
                  {t("common.viewAll")}
                </a>
              </div>
              <div className="divide-y divide-slate-50">
                {recentTabs.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-400">{t("dashboard.noTabs")}</p>
                ) : (
                  recentTabs.map((tab) => (
                    <div
                      key={tab.id}
                      className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{tab.title}</p>
                        <p className="text-xs text-slate-400">
                          {tab.artist || t("dashboard.noArtist")}
                        </p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2 text-xs text-slate-400">
                        <span className="hidden sm:inline">👁 {tab.viewCount}</span>
                        <span className="hidden sm:inline">♥ {tab.likeCount}</span>
                        <Badge variant={tab.isPublic ? "success" : "default"}>
                          {tab.isPublic ? t("common.public") : t("common.private")}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
