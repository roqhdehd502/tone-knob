import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Music,
  FileMusic,
  Radio,
  Calendar,
  Edit3,
  Save,
  X,
  Loader2,
  Users,
  Eye,
  Heart,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [{ title: "프로필 - Tone Knob" }, { name: "description", content: "사용자 프로필" }];
}

export default function Profile() {
  const { user, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ displayName: "", bio: "" });
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [myTabs, setMyTabs] = useState<TabListItem[]>([]);
  const [tabTotal, setTabTotal] = useState(0);

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
    }
  }, [user]);

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
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile header card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-linear-to-r from-violet-600 via-indigo-600 to-purple-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-5">
            <Avatar className="-mt-12 h-20 w-20 ring-4 ring-white dark:ring-gray-900">
              <AvatarImage src={user.avatarUrl || ""} alt={user.displayName || ""} />
              <AvatarFallback className="bg-violet-100 text-xl font-bold text-violet-700 dark:bg-violet-900 dark:text-violet-300">
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
                  수정
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
                    저장
                  </Button>
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">표시 이름</Label>
                <Input
                  id="displayName"
                  value={editData.displayName}
                  onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">소개</Label>
                <textarea
                  id="bio"
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm transition-colors focus:border-violet-500 focus:outline-none dark:border-gray-700"
                  placeholder="자기소개를 입력하세요..."
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
                  {new Date(user.createdAt).toLocaleDateString("ko-KR")} 가입
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <strong className="text-gray-900 dark:text-white">{followerCount}</strong> 팔로워
                </span>
                <span className="flex items-center gap-1.5">
                  <strong className="text-gray-900 dark:text-white">{followingCount}</strong> 팔로잉
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: FileMusic, value: tabTotal, label: "제작한 타브" },
          { icon: Radio, value: followerCount, label: "팔로워" },
          {
            icon: Music,
            value: user.subscriptionTier === "free" ? "Free" : user.subscriptionTier,
            label: "구독 플랜",
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <stat.icon className="mx-auto h-5 w-5 text-violet-600 dark:text-violet-400" />
            <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* My tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">내 타브</CardTitle>
        </CardHeader>
        <CardContent>
          {myTabs.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
              <FileMusic className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                아직 제작한 타브가 없습니다
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/editor/new">첫 타브 만들기</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {myTabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={`/editor/${tab.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:border-violet-200 hover:bg-violet-50/50 dark:border-gray-800 dark:hover:border-violet-800 dark:hover:bg-violet-950/30"
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
                      {tab.isPublic ? "공개" : "비공개"}
                    </span>
                  </div>
                </Link>
              ))}
              {tabTotal > 10 && (
                <p className="pt-2 text-center text-xs text-gray-400">외 {tabTotal - 10}개 더</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
