import {
  Bot,
  CreditCard,
  Headphones,
  Music,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

import type { Route } from "./+types/dashboard";

import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { StatsCard } from "~/components/ui/StatsCard";
import { requireAdmin } from "~/service/session.server";
import { getDashboardStats, getRecentTabs, getRecentUsers } from "~/service/stats.server";
import type { StatsPeriod } from "~/service/stats.server";

export function meta() {
  return [{ title: "대시보드 - Tone Knob Admin" }];
}

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

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: "today", label: "오늘" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
  { value: "all", label: "전체" },
];

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { admin, stats, recentUsers, recentTabs, period } = loaderData;

  return (
    <>
      <Topbar adminName={admin.adminName} adminEmail={admin.adminEmail} title="대시보드" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4 lg:space-y-6">

          {/* Period selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">기간:</span>
            <div className="flex rounded-lg border border-slate-200 bg-white text-sm">
              {PERIOD_OPTIONS.map((opt, i) => (
                <a
                  key={opt.value}
                  href={`/?period=${opt.value}`}
                  className={`px-3 py-1.5 transition-colors ${
                    period === opt.value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  } ${i === 0 ? "rounded-l-lg" : i === PERIOD_OPTIONS.length - 1 ? "rounded-r-lg" : ""}`}
                >
                  {opt.label}
                </a>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatsCard
              title="전체 유저"
              value={stats.users.total}
              icon={Users}
              iconColor="text-blue-600"
              trend={{ value: stats.users.newInPeriod, label: `신규 (${stats.periodLabel})` }}
            />
            <StatsCard
              title="전체 타브"
              value={stats.tabs.total}
              icon={Music}
              iconColor="text-violet-600"
              trend={{ value: stats.tabs.newInPeriod, label: `신규 (${stats.periodLabel})` }}
            />
            <StatsCard
              title="활성 구독"
              value={stats.subscriptions.active}
              icon={CreditCard}
              iconColor="text-emerald-600"
              sub="active 상태"
            />
            <StatsCard
              title="활성 합주방"
              value={stats.jamRooms.active}
              icon={Headphones}
              iconColor="text-orange-500"
              sub="현재 진행 중"
            />
            <StatsCard
              title="총 녹음"
              value={stats.recordings.total}
              icon={Video}
              iconColor="text-pink-600"
            />
            <StatsCard
              title="완료 결제"
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
                <p className="text-sm font-semibold text-amber-900">AI 대기 작업</p>
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
                <p className="text-sm font-semibold text-red-900">AI 실패 작업</p>
                <p className="text-2xl font-bold text-red-800">{stats.aiJobs.failed}</p>
              </div>
            </a>
          </div>

          {/* Recent Data Tables */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

            {/* Recent Users */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
                <h2 className="text-sm font-semibold text-slate-900">최근 가입 유저</h2>
                <a href="/users" className="text-xs font-medium text-blue-600 hover:underline">
                  전체 보기 →
                </a>
              </div>
              <div className="divide-y divide-slate-50">
                {recentUsers.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-400">유저가 없습니다.</p>
                ) : (
                  recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {user.displayName || user.username}
                        </p>
                        <p className="truncate text-xs text-slate-400">{user.email}</p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        {user.role === "admin" && <Badge variant="danger">admin</Badge>}
                        {user.role === "banned" && <Badge variant="warning">정지</Badge>}
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
                <h2 className="text-sm font-semibold text-slate-900">최근 등록 타브</h2>
                <a href="/tabs" className="text-xs font-medium text-blue-600 hover:underline">
                  전체 보기 →
                </a>
              </div>
              <div className="divide-y divide-slate-50">
                {recentTabs.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-400">타브가 없습니다.</p>
                ) : (
                  recentTabs.map((tab) => (
                    <div key={tab.id} className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{tab.title}</p>
                        <p className="text-xs text-slate-400">{tab.artist || "아티스트 미입력"}</p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2 text-xs text-slate-400">
                        <span className="hidden sm:inline">👁 {tab.viewCount}</span>
                        <span className="hidden sm:inline">♥ {tab.likeCount}</span>
                        <Badge variant={tab.isPublic ? "success" : "default"}>
                          {tab.isPublic ? "공개" : "비공개"}
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
