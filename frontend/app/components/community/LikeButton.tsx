import { memo, useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/api";

interface LikeButtonProps {
  tabId: string;
  initialLikeCount: number;
  isLoggedIn: boolean;
}

export const LikeButton = memo(function LikeButton({
  tabId,
  initialLikeCount,
  isLoggedIn,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    api.community
      .isLiked(tabId)
      .then((res) => setLiked(res.liked))
      .catch(() => {});
  }, [tabId, isLoggedIn]);

  const handleToggle = async () => {
    if (!isLoggedIn || loading) return;
    setLoading(true);
    try {
      const result = await api.community.toggleLike(tabId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={!isLoggedIn || loading}
      className="gap-1.5"
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
      <span className="text-sm">{likeCount}</span>
    </Button>
  );
});
