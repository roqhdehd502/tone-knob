import type { TabRow, UserRow } from "~/types/db";

import { getSupabase } from "./supabase.server";

export type StatsPeriod = "today" | "7d" | "30d" | "all";

function periodStart(period: StatsPeriod): string | null {
  if (period === "all") return null;
  const now = Date.now();
  if (period === "today") return new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  if (period === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (period === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

export async function getDashboardStats(period: StatsPeriod = "7d") {
  const supabase = getSupabase();
  const since = periodStart(period);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const newSince = since ?? sevenDaysAgo;

  const [
    usersTotal,
    usersNew,
    tabsTotal,
    tabsNew,
    subsActive,
    jamRoomsActive,
    recordingsTotal,
    paymentsCompleted,
    aiQueued,
    aiFailed,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("createdAt", newSince),
    supabase.from("tabs").select("*", { count: "exact", head: true }),
    supabase.from("tabs").select("*", { count: "exact", head: true }).gte("createdAt", newSince),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("jam_rooms").select("*", { count: "exact", head: true }).eq("isActive", true),
    supabase.from("recordings").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("ai_jobs").select("*", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("ai_jobs").select("*", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  const periodLabel =
    period === "today" ? "오늘" :
    period === "7d" ? "7일" :
    period === "30d" ? "30일" : "전체";

  return {
    users: { total: usersTotal.count ?? 0, newInPeriod: usersNew.count ?? 0 },
    tabs: { total: tabsTotal.count ?? 0, newInPeriod: tabsNew.count ?? 0 },
    subscriptions: { active: subsActive.count ?? 0 },
    jamRooms: { active: jamRoomsActive.count ?? 0 },
    recordings: { total: recordingsTotal.count ?? 0 },
    payments: { completed: paymentsCompleted.count ?? 0 },
    aiJobs: { queued: aiQueued.count ?? 0, failed: aiFailed.count ?? 0 },
    periodLabel,
  };
}

export async function getRecentUsers(limit = 10): Promise<UserRow[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("users")
    .select("id, email, username, displayName, role, subscriptionTier, createdAt")
    .order("createdAt", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as UserRow[];
}

export async function getRecentTabs(limit = 10): Promise<TabRow[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("tabs")
    .select("id, title, artist, isPublic, viewCount, likeCount, downloadCount, createdAt, userId")
    .order("createdAt", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as TabRow[];
}
