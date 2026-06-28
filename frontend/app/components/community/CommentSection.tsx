import { useEffect, useRef, useState } from "react";

import { CornerDownRight, Edit3, MessageCircle, Send, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/lib/api";
import type { CommentData } from "~/types/community";

interface CommentSectionProps {
  tabId: string;
  currentUserId?: string;
}

export function CommentSection({ tabId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replies, setReplies] = useState<Map<string, CommentData[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadComments();
  }, [tabId, page]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const result = await api.community.getComments(tabId, page);
      setComments(result.comments);
      setTotal(result.total);
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;
    try {
      await api.community.createComment(tabId, { content: newComment.trim() });
      setNewComment("");
      await loadComments();
    } catch {
      // 에러 무시
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !currentUserId) return;
    try {
      await api.community.createComment(tabId, {
        content: replyContent.trim(),
        parentId,
      });
      setReplyTo(null);
      setReplyContent("");
      await loadReplies(parentId);
    } catch {
      // 에러 무시
    }
  };

  const loadReplies = async (commentId: string) => {
    try {
      const data = await api.community.getReplies(commentId);
      setReplies((prev) => new Map(prev).set(commentId, data));
    } catch {
      // 에러 무시
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await api.community.updateComment(commentId, {
        content: editContent.trim(),
      });
      setEditingId(null);
      setEditContent("");
      await loadComments();
    } catch {
      // 에러 무시
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.community.deleteComment(commentId);
      await loadComments();
    } catch {
      // 에러 무시
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">댓글 ({total})</h3>
      </div>

      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            maxLength={2000}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!newComment.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      {loading && comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">로딩 중...</p>
      ) : comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">아직 댓글이 없습니다</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {comment.user?.displayName || comment.user?.username || "알 수 없음"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>

                {editingId === comment.id ? (
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button size="sm" onClick={() => handleEdit(comment.id)}>
                      저장
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      취소
                    </Button>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                )}

                <div className="mt-2 flex gap-2">
                  {currentUserId && (
                    <button
                      onClick={() => {
                        setReplyTo(replyTo === comment.id ? null : comment.id);
                        setReplyContent("");
                      }}
                      className="text-xs text-gray-500 hover:text-miami-500"
                    >
                      답글
                    </button>
                  )}
                  <button
                    onClick={() => loadReplies(comment.id)}
                    className="text-xs text-gray-500 hover:text-miami-500"
                  >
                    답글 보기
                  </button>
                  {currentUserId === comment.userId && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                        className="text-xs text-gray-500 hover:text-blue-500"
                      >
                        <Edit3 className="inline h-3 w-3" /> 수정
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="inline h-3 w-3" /> 삭제
                      </button>
                    </>
                  )}
                </div>
              </div>

              {replyTo === comment.id && (
                <div className="ml-6 flex gap-2">
                  <CornerDownRight className="mt-2 h-4 w-4 shrink-0 text-gray-400" />
                  <Input
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답글을 입력하세요..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    disabled={!replyContent.trim()}
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {replies.get(comment.id)?.map((reply) => (
                <div key={reply.id} className="ml-6 rounded-lg bg-gray-100 p-2.5 dark:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {reply.user?.displayName || reply.user?.username || "알 수 없음"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(reply.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{reply.content}</p>
                  {currentUserId === reply.userId && (
                    <button
                      onClick={() => handleDelete(reply.id)}
                      className="mt-1 text-[10px] text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="inline h-2.5 w-2.5" /> 삭제
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </Button>
          <span className="flex items-center text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
