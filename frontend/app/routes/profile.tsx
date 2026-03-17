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
import { Separator } from "~/components/ui/separator";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "프로필 - Tone Knob" },
    { name: "description", content: "사용자 프로필" },
  ];
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
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          프로필
        </h1>
        {!isEditing ? (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="h-4 w-4" />
            수정
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4" />
              취소
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              저장
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-8">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={user.avatarUrl || ""}
                alt={user.displayName || ""}
              />
              <AvatarFallback className="text-2xl">
                {(user.displayName || user.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button variant="ghost" size="sm" className="mt-2 text-xs">
                사진 변경
              </Button>
            )}
          </div>

          <div className="mt-4 flex-1 space-y-4 sm:mt-0">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">표시 이름</Label>
                  <Input
                    id="displayName"
                    value={editData.displayName}
                    onChange={(e) =>
                      setEditData({ ...editData, displayName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">소개</Label>
                  <textarea
                    id="bio"
                    value={editData.bio}
                    onChange={(e) =>
                      setEditData({ ...editData, bio: e.target.value })
                    }
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-gray-700"
                    placeholder="자기소개를 입력하세요..."
                  />
                  <p className="text-right text-xs text-gray-400">
                    {editData.bio.length}/500
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {user.displayName || user.username}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{user.username}
                  </p>
                </div>
                {user.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {user.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")} 가입
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <strong className="text-gray-900 dark:text-white">
                      {followerCount}
                    </strong>{" "}
                    팔로워
                  </span>
                  <span className="flex items-center gap-1">
                    <strong className="text-gray-900 dark:text-white">
                      {followingCount}
                    </strong>{" "}
                    팔로잉
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-gray-900">
          <FileMusic className="mx-auto h-6 w-6 text-violet-600 dark:text-violet-400" />
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {tabTotal}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            제작한 타브
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-gray-900">
          <Radio className="mx-auto h-6 w-6 text-violet-600 dark:text-violet-400" />
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {followerCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">팔로워</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-gray-900">
          <Music className="mx-auto h-6 w-6 text-violet-600 dark:text-violet-400" />
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {user.subscriptionTier === "free" ? "Free" : user.subscriptionTier}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">구독 플랜</p>
        </div>
      </div>

      <Separator />

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          내 타브
        </h2>
        {myTabs.length === 0 ? (
          <>
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              아직 제작한 타브가 없습니다
            </p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" asChild>
                <Link to="/editor/new">첫 타브 만들기</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-4 space-y-3">
            {myTabs.map((tab) => (
              <Link
                key={tab.id}
                to={`/editor/${tab.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {tab.title}
                  </p>
                  {tab.artist && (
                    <p className="text-xs text-gray-500">{tab.artist}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {tab.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
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
              <p className="text-center text-xs text-gray-400">
                외 {tabTotal - 10}개 더
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
