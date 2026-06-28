import type { CommentData, FollowData } from "~/types/community";
import type { CreateJamRoomDto, JamParticipant, JamRoom, JoinJamRoomDto } from "~/types/jam-room";
import type { TabDetail, TabDocument, TabListResponse, TabVersion } from "~/types/tab";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(endpoint, options);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Network error" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** multipart/form-data 파일 업로드 — request()와 달리 Content-Type을 브라우저가 boundary와 함께 설정하도록 둔다 */
async function uploadFile<T>(
  endpoint: string,
  file: Blob,
  options?: { folder?: string; fileName?: string },
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const formData = new FormData();
  const fileName = options?.fileName ?? (file instanceof File ? file.name : "upload");
  formData.append("file", file, fileName);
  if (options?.folder) formData.append("folder", options.folder);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Network error" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  subscriptionTier: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const api = {
  auth: {
    register: (data: { email: string; username: string; password: string; displayName?: string }) =>
      request<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: data,
      }),
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>("/api/auth/login", { method: "POST", body: data }),
    me: () => request<User>("/api/auth/me"),
  },
  users: {
    get: (id: string) => request<User>(`/api/users/${id}`),
    update: (id: string, data: { displayName?: string; avatarUrl?: string; bio?: string }) =>
      request<User>(`/api/users/${id}`, { method: "PUT", body: data }),
  },
  tabs: {
    list: (params?: { page?: number; limit?: number; search?: string; userId?: string }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.search) qs.set("search", params.search);
      if (params?.userId) qs.set("userId", params.userId);
      const query = qs.toString();
      return request<TabListResponse>(`/api/tabs${query ? `?${query}` : ""}`);
    },
    my: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<TabListResponse>(`/api/tabs/my${query ? `?${query}` : ""}`);
    },
    get: (id: string) => request<TabDetail>(`/api/tabs/${id}`),
    create: (data: { title: string; artist?: string; content: TabDocument; isPublic?: boolean }) =>
      request<TabDetail>("/api/tabs", { method: "POST", body: data }),
    update: (
      id: string,
      data: {
        title?: string;
        artist?: string;
        content?: TabDocument;
        isPublic?: boolean;
        changeDescription?: string;
      },
    ) => request<TabDetail>(`/api/tabs/${id}`, { method: "PUT", body: data }),
    delete: (id: string) => request<void>(`/api/tabs/${id}`, { method: "DELETE" }),
    fork: (id: string) => request<TabDetail>(`/api/tabs/${id}/fork`, { method: "POST" }),
    versions: (id: string) => request<TabVersion[]>(`/api/tabs/${id}/versions`),
    togglePublish: (id: string) =>
      request<TabDetail>(`/api/tabs/${id}/publish`, { method: "POST" }),
    feed: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<TabListResponse>(`/api/tabs/feed${query ? `?${query}` : ""}`);
    },
  },
  jamRooms: {
    list: (params?: { page?: number; limit?: number; isActive?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
      const query = qs.toString();
      return request<{
        data: JamRoom[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/jam-rooms${query ? `?${query}` : ""}`);
    },
    get: (id: string) => request<JamRoom>(`/api/jam-rooms/${id}`),
    create: (data: CreateJamRoomDto) =>
      request<JamRoom>("/api/jam-rooms", { method: "POST", body: data }),
    join: (id: string, data: JoinJamRoomDto) =>
      request<JamParticipant>(`/api/jam-rooms/${id}/join`, {
        method: "POST",
        body: data,
      }),
    leave: (id: string) =>
      request<{ message: string }>(`/api/jam-rooms/${id}/leave`, {
        method: "POST",
      }),
    participants: (id: string) => request<JamParticipant[]>(`/api/jam-rooms/${id}/participants`),
    close: (id: string) =>
      request<{ message: string }>(`/api/jam-rooms/${id}`, {
        method: "DELETE",
      }),
  },
  community: {
    // 좋아요
    toggleLike: (tabId: string) =>
      request<{ liked: boolean; likeCount: number }>(`/api/community/tabs/${tabId}/like`, {
        method: "POST",
      }),
    isLiked: (tabId: string) => request<{ liked: boolean }>(`/api/community/tabs/${tabId}/like`),

    // 댓글
    getComments: (tabId: string, page = 1, limit = 20) =>
      request<{ comments: CommentData[]; total: number }>(
        `/api/community/tabs/${tabId}/comments?page=${page}&limit=${limit}`,
      ),
    createComment: (tabId: string, data: { content: string; parentId?: string }) =>
      request<CommentData>(`/api/community/tabs/${tabId}/comments`, {
        method: "POST",
        body: data,
      }),
    getReplies: (commentId: string) =>
      request<CommentData[]>(`/api/community/comments/${commentId}/replies`),
    updateComment: (commentId: string, data: { content: string }) =>
      request<CommentData>(`/api/community/comments/${commentId}`, {
        method: "PUT",
        body: data,
      }),
    deleteComment: (commentId: string) =>
      request<{ message: string }>(`/api/community/comments/${commentId}`, {
        method: "DELETE",
      }),

    // 팔로우
    toggleFollow: (userId: string) =>
      request<{ following: boolean }>(`/api/community/users/${userId}/follow`, {
        method: "POST",
      }),
    isFollowing: (userId: string) =>
      request<{ following: boolean }>(`/api/community/users/${userId}/follow`),
    getFollowers: (userId: string, page = 1, limit = 20) =>
      request<{ followers: FollowData[]; total: number }>(
        `/api/community/users/${userId}/followers?page=${page}&limit=${limit}`,
      ),
    getFollowing: (userId: string, page = 1, limit = 20) =>
      request<{ following: FollowData[]; total: number }>(
        `/api/community/users/${userId}/following?page=${page}&limit=${limit}`,
      ),
    getUserStats: (userId: string) =>
      request<{ followerCount: number; followingCount: number }>(
        `/api/community/users/${userId}/stats`,
      ),
  },
  subscriptions: {
    getPlans: () =>
      request<{ plan: string; priceMonthly: number; features: string[] }[]>(
        "/api/subscriptions/plans",
      ),
    getCurrent: () =>
      request<{
        id: string;
        plan: string;
        status: string;
        priceMonthly: number;
        currentPeriodStart: string;
        currentPeriodEnd: string;
      } | null>("/api/subscriptions/current"),
    subscribe: (plan: string, externalPaymentId?: string) =>
      request<{ id: string; plan: string; status: string }>("/api/subscriptions/subscribe", {
        method: "POST",
        body: { plan, externalPaymentId },
      }),
    cancel: () =>
      request<{ id: string; plan: string; status: string }>("/api/subscriptions/cancel", {
        method: "POST",
      }),
    getHistory: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<{ data: unknown[]; total: number }>(
        `/api/subscriptions/history${query ? `?${query}` : ""}`,
      );
    },
  },
  marketplace: {
    listPaidTabs: (params?: {
      page?: number;
      limit?: number;
      sort?: "popular" | "oldest" | "newest";
    }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.sort) qs.set("sort", params.sort);
      const query = qs.toString();
      return request<TabListResponse>(`/api/marketplace/tabs${query ? `?${query}` : ""}`);
    },
    setPrice: (tabId: string, price: number) =>
      request<TabDetail>(`/api/marketplace/tabs/${tabId}/price`, {
        method: "POST",
        body: { price },
      }),
    purchase: (tabId: string) =>
      request<{
        id: string;
        tabId: string;
        price: number;
        status: string;
        createdAt: string;
      }>(`/api/marketplace/tabs/${tabId}/purchase`, { method: "POST" }),
    hasPurchased: (tabId: string) =>
      request<{ purchased: boolean }>(`/api/marketplace/tabs/${tabId}/purchased`),
    myPurchases: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<{ data: unknown[]; total: number }>(
        `/api/marketplace/my/purchases${query ? `?${query}` : ""}`,
      );
    },
    mySales: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<{ data: unknown[]; total: number; totalRevenue: number }>(
        `/api/marketplace/my/sales${query ? `?${query}` : ""}`,
      );
    },
  },
  practice: {
    recordSession: (data: {
      tabId?: string;
      durationSeconds: number;
      bpm?: number;
      speedMultiplier?: number;
      loopStartMeasure?: number;
      loopEndMeasure?: number;
    }) =>
      request<{ id: string }>("/api/practice/sessions", {
        method: "POST",
        body: data,
      }),
    getStats: () =>
      request<{
        totalSessions: number;
        totalMinutes: number;
        averageSessionMinutes: number;
        thisWeekMinutes: number;
        thisMonthMinutes: number;
        streak: number;
      }>("/api/practice/stats"),
    getSessions: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<{ data: unknown[]; total: number }>(
        `/api/practice/sessions${query ? `?${query}` : ""}`,
      );
    },
  },
  recordings: {
    create: (data: {
      title: string;
      description?: string;
      audioUrl: string;
      durationSeconds: number;
      tabId?: string;
      visibility?: "public" | "private" | "unlisted";
    }) =>
      request<{
        id: string;
        title: string;
        audioUrl: string;
        durationSeconds: number;
        visibility: string;
        createdAt: string;
      }>("/api/recordings", { method: "POST", body: data }),
    getPublic: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<{ data: unknown[]; total: number }>(
        `/api/recordings/public${query ? `?${query}` : ""}`,
      );
    },
    getMy: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<{ data: unknown[]; total: number }>(
        `/api/recordings/my${query ? `?${query}` : ""}`,
      );
    },
    getById: (id: string) =>
      request<{
        id: string;
        title: string;
        description: string;
        audioUrl: string;
        durationSeconds: number;
        visibility: string;
        playCount: number;
        user: { id: string; displayName: string };
        tab: { id: string; title: string } | null;
        createdAt: string;
      }>(`/api/recordings/${id}`),
    update: (
      id: string,
      data: {
        title?: string;
        description?: string;
        visibility?: "public" | "private" | "unlisted";
      },
    ) =>
      request<{ id: string }>(`/api/recordings/${id}`, {
        method: "PUT",
        body: data,
      }),
    delete: (id: string) => request<void>(`/api/recordings/${id}`, { method: "DELETE" }),
    play: (id: string) => request<void>(`/api/recordings/${id}/play`, { method: "POST" }),
    getShareUrl: (id: string) => request<{ url: string }>(`/api/recordings/${id}/share`),
  },
  knob: {
    getBalance: () => request<{ balance: number }>("/api/knob/balance"),
    getHistory: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<{
        data: {
          id: string;
          type: string;
          amount: number;
          balanceAfter: number;
          description: string | null;
          createdAt: string;
        }[];
        total: number;
      }>(`/api/knob/history${query ? `?${query}` : ""}`);
    },
  },
  badges: {
    getAll: () =>
      request<
        {
          id: string;
          code: string;
          name: string;
          description: string | null;
          icon: string | null;
          category: string;
        }[]
      >("/api/badges"),
    getMy: () =>
      request<
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
      >("/api/badges/my"),
    getUserBadges: (userId: string) =>
      request<
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
      >(`/api/badges/user/${userId}`),
    getFeatured: (userId: string) =>
      request<
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
      >(`/api/badges/user/${userId}/featured`),
    toggleFeatured: (userBadgeId: string) =>
      request<{ id: string; isFeatured: boolean }>(`/api/badges/${userBadgeId}/featured`, {
        method: "PATCH",
      }),
  },
  aiGen: {
    createTabJob: (data: {
      prompt: string;
      genre?: string;
      instrument?: string;
      difficulty?: string;
      measures?: number;
    }) =>
      request<{ id: string; status: string }>("/api/ai-gen/tab", {
        method: "POST",
        body: data,
      }),
    createAudioExtractionJob: (data: { audioUrl: string; instrument?: string; tuning?: string }) =>
      request<{ id: string; status: string }>("/api/ai-gen/audio-extraction", {
        method: "POST",
        body: data,
      }),
    getMyJobs: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return request<{ data: unknown[]; total: number }>(
        `/api/ai-gen/jobs${query ? `?${query}` : ""}`,
      );
    },
    getJob: (id: string) =>
      request<{
        id: string;
        status: string;
        progress: number;
        inputData: Record<string, unknown>;
        outputData: Record<string, unknown> | null;
        errorMessage: string | null;
        createdAt: string;
      }>(`/api/ai-gen/jobs/${id}`),
  },
  media: {
    upload: (file: Blob, options?: { folder?: string; fileName?: string }) =>
      uploadFile<{ url: string; path: string }>("/api/media/upload", file, options),
  },
};
