import { memo, useEffect, useState } from "react";

import { UserCheck, UserPlus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";

interface FollowButtonProps {
  targetUserId: string;
  currentUserId?: string;
}

export const FollowButton = memo(function FollowButton({
  targetUserId,
  currentUserId,
}: FollowButtonProps) {
  const { t } = useI18n();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSelf = currentUserId === targetUserId;

  useEffect(() => {
    if (!currentUserId || isSelf) return;
    api.community
      .isFollowing(targetUserId)
      .then((res) => setFollowing(res.following))
      .catch(() => {});
  }, [targetUserId, currentUserId, isSelf]);

  const handleToggle = async () => {
    if (!currentUserId || isSelf || loading) return;
    setLoading(true);
    try {
      const result = await api.community.toggleFollow(targetUserId);
      setFollowing(result.following);
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  };

  if (isSelf || !currentUserId) return null;

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-1.5"
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4" />
          {t("community.following")}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {t("community.follow")}
        </>
      )}
    </Button>
  );
});
