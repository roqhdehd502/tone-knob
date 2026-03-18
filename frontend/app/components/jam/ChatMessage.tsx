import { memo } from "react";

import type { ChatMessage as ChatMessageType } from "~/lib/jam/use-jam-socket";

interface ChatMessageProps {
  msg: ChatMessageType;
  isMe: boolean;
  senderName: string;
}

export const ChatMessageItem = memo(function ChatMessageItem({
  msg,
  isMe,
  senderName,
}: ChatMessageProps) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-xs font-semibold ${isMe ? "text-miami-600 dark:text-miami-400" : "text-gray-700 dark:text-gray-300"}`}
        >
          {isMe ? "나" : senderName}
        </span>
        <span className="text-[10px] text-gray-400">
          {new Date(msg.timestamp).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="text-sm text-gray-800 dark:text-gray-200">{msg.message}</p>
    </div>
  );
});
