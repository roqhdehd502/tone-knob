import type { User } from "~/lib/api";

export interface CommentData {
  id: string;
  userId: string;
  tabId: string;
  content: string;
  parentId: string | null;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface FollowData {
  id: string;
  followerId: string;
  followingId: string;
  follower?: User;
  following?: User;
  createdAt: string;
}
