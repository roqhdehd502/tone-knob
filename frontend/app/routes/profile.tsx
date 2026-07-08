import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import {
  Award,
  Calendar,
  Coins,
  Edit3,
  Eye,
  FileMusic,
  Heart,
  Loader2,
  Music,
  Radio,
  Save,
  Star,
  Users,
  X,
} from "lucide-react";

import { PageLoader } from "~/components/common/PageLoader";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [{ title: "Profile - Tone Knob" }, { name: "description", content: "User profile" }];
}

export default function Profile() {
  const { user, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { t, dateLocale } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ displayName: "", bio: "" });
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [myTabs, setMyTabs] = useState<TabListItem[]>([]);
  const [tabTotal, setTabTotal] = useState(0);
  const [knobBalance, setKnobBalance] = useState(0);
  const [badges, setBadges] = useState<
    {
      id: string;
      badgeId: string;
      isFeatured: boolean;
      earnedAt: string;
      badge: {
        id: string;
        code: string;
        name: string;
        description: string | null;
        icon: string | null;
        category: string;
      };
    }[]
  >([]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      setEditData({
        displayName: user.displayName || "",
        bio: user.bio || "",
      });
      api.community
        .getUserStats(user.id)
        .then((stats) => {
          setFollowerCount(stats.followerCount);
          setFollowingCount(stats.followingCount);
        })
        .catch(() => {});
      api.tabs
        .my({ limit: 10 })
        .then((res) => {
          setMyTabs(res.data);
          setTabTotal(res.total);
        })
        .catch(() => {});
      api.knob
        .getBalance()
        .then((res) => setKnobBalance(res.balance))
        .catch(() => {});
      api.badges
        .getMy()
        .then((res) => setBadges(res))
        .catch(() => {});
    }
  }, [user]);

  const handleToggleFeatured = async (userBadgeId: string) => {
    try {
      const result = await api.badges.toggleFeatured(userBadgeId);
      setBadges((prev) =>
        prev.map((b) => (b.id === userBadgeId ? { ...b, isFeatured: result.isFeatured } : b)),
      );
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await api.users.update(user.id, {
        displayName: editData.displayName,
        bio: editData.bio,
      });
      await refreshUser();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return <PageLoader />;
  }

  const statsGrid = [
    { icon: FileMusic, value: tabTotal, label: t("profile.tabsCreated") },
    { icon: Radio, value: followerCount, label: t("profile.followersLabel") },
    { icon: Coins, value: knobBalance.toLocaleString(), label: t("profile.knobBalance") },
    {
      icon: Music,
      value: user.subscriptionTier === "free" ? "Free" : user.subscriptionTier,
      label: t("profile.subscriptionPlan"),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="overflow-hidden">
        <div className="h-24 bg-linear-to-r from-miami-600 via-miami-600 to-rosewood-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-5">
            <Avatar className="-mt-12 h-20 w-20 ring-4 ring-white dark:ring-gray-900">
              <AvatarImage src={user.avatarUrl || ""} alt={user.displayName || ""} />
              <AvatarFallback className="bg-miami-100 text-xl font-bold text-miami-700 dark:bg-miami-900 dark:text-miami-300">
                {(user.displayName || user.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="mt-3 flex flex-1 items-start justify-between sm:mt-0">
              <div>
                {!isEditing && (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {user.displayName || user.username}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </>
                )}
              </div>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {t("profile.edit")}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {t("profile.save")}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t("profile.displayNameLabel")}</Label>
                <Input
                  id="displayName"
                  value={editData.displayName}
                  onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">{t("profile.bioLabel")}</Label>
                <textarea
                  id="bio"
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm transition-colors focus:border-miami-500 focus:outline-none dark:border-gray-700"
                  placeholder={t("profile.bioPlaceholder")}
                />
                <p className="text-right text-xs text-gray-400">{editData.bio.length}/500</p>
              </div>
            </div>
          ) : (
            <>
              {user.bio && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{user.bio}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("profile.joinDate", {
                    date: new Date(user.createdAt).toLocaleDateString(dateLocale),
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {t("profile.followers", { n: followerCount })}
                </span>
                <span className="flex items-center gap-1.5">
                  {t("profile.following", { n: followingCount })}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statsGrid.map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <stat.icon className="mx-auto h-5 w-5 text-miami-600 dark:text-miami-400" />
            <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-miami-600" />
            {t("profile.badgeCollection")}
            {badges.length > 0 && (
              <span className="ml-auto text-xs font-normal text-gray-400">
                {t("profile.featuredBadges", { n: badges.filter((b) => b.isFeatured).length })}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
              <Award className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("profile.noBadges")}</p>
              <p className="text-xs text-gray-400">{t("profile.noBadgesHint")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {badges.map((ub) => (
                <button
                  key={ub.id}
                  onClick={() => handleToggleFeatured(ub.id)}
                  className={`group relative flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all ${
                    ub.isFeatured
                      ? "border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-950/30"
                      : "border-gray-200 bg-white hover:border-miami-200 hover:bg-miami-50/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-miami-800"
                  }`}
                >
                  {ub.isFeatured && (
                    <Star className="absolute right-1.5 top-1.5 h-3 w-3 fill-amber-400 text-amber-400" />
                  )}
                  <span className="text-2xl">{ub.badge.icon || "🏆"}</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {ub.badge.name}
                  </span>
                  {ub.badge.description && (
                    <span className="line-clamp-2 text-[10px] text-gray-400">
                      {ub.badge.description}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {new Date(ub.earnedAt).toLocaleDateString(dateLocale)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("profile.myTabs")}</CardTitle>
        </CardHeader>
        <CardContent>
          {myTabs.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
              <FileMusic className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("profile.noTabs")}</p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/editor/new">{t("profile.createFirstTab")}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {myTabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={`/editor/${tab.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:border-miami-200 hover:bg-miami-50/50 dark:border-gray-800 dark:hover:border-miami-800 dark:hover:bg-miami-950/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {tab.title}
                    </p>
                    {tab.artist && <p className="text-xs text-gray-500">{tab.artist}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {tab.viewCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" />
                      {tab.likeCount}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        tab.isPublic
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                      }`}
                    >
                      {tab.isPublic ? t("profile.publicLabel") : t("profile.privateLabel")}
                    </span>
                  </div>
                </Link>
              ))}
              {tabTotal > 10 && (
                <p className="pt-2 text-center text-xs text-gray-400">
                  {t("profile.moreItems", { n: tabTotal - 10 })}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
