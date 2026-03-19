import { getAvatarColor, getAvatarInitial } from "~/lib/hash-color";
import { cn } from "~/lib/utils";

interface UserAvatarProps {
  userId: string;
  displayName?: string | null;
  username?: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-2xl",
};

export function UserAvatar({
  userId,
  displayName,
  username,
  avatarUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || username || "User"}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  const bgColor = getAvatarColor(userId);
  const initial = getAvatarInitial(displayName, username);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white",
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initial}
    </div>
  );
}
