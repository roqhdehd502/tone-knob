import { AlertCircle, Loader2, Users, Wifi, WifiOff } from "lucide-react";

import { useI18n } from "~/context/i18n";
import type { CollabStatus as Status } from "~/hooks/useCollabEditor";

interface CollabStatusProps {
  status: Status;
  revision: number;
  activeUserIds: string[];
  className?: string;
}

export function CollabStatus({
  status,
  revision,
  activeUserIds,
  className = "",
}: CollabStatusProps) {
  const { t } = useI18n();

  const STATUS_CONFIG: Record<Status, { icon: React.ReactNode; label: string; color: string }> = {
    connected: {
      icon: <Wifi className="h-3.5 w-3.5" />,
      label: t("collab.connected"),
      color: "text-green-500",
    },
    connecting: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      label: t("collab.connecting"),
      color: "text-amber-500",
    },
    disconnected: {
      icon: <WifiOff className="h-3.5 w-3.5" />,
      label: t("collab.offline"),
      color: "text-gray-400",
    },
    error: {
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      label: t("collab.error"),
      color: "text-red-500",
    },
  };

  const cfg = STATUS_CONFIG[status];

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* 연결 상태 */}
      <span className={`flex items-center gap-1 font-medium ${cfg.color}`}>
        {cfg.icon}
        {cfg.label}
      </span>

      {status === "connected" && (
        <>
          {/* 리비전 */}
          <span className="text-gray-400">r{revision}</span>

          {/* 협업 참가자 수 */}
          {activeUserIds.length > 0 && (
            <span className="flex items-center gap-1 text-miami-600 dark:text-miami-400">
              <Users className="h-3.5 w-3.5" />
              {t("collab.editingCount", { n: activeUserIds.length })}
            </span>
          )}

          {/* 아바타 스택 */}
          {activeUserIds.length > 0 && (
            <div className="flex -space-x-1.5">
              {activeUserIds.slice(0, 5).map((uid, i) => (
                <div
                  key={uid}
                  title={uid}
                  style={{ backgroundColor: USER_COLORS[i % USER_COLORS.length] }}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-1 ring-white dark:ring-gray-900"
                >
                  {uid.slice(0, 1).toUpperCase()}
                </div>
              ))}
              {activeUserIds.length > 5 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-gray-700 ring-1 ring-white dark:ring-gray-900">
                  +{activeUserIds.length - 5}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const USER_COLORS = ["#7c3aed", "#db2777", "#0891b2", "#16a34a", "#ea580c", "#4f46e5"];
