import type {
  TabDetail,
  TabListResponse,
  TabDocument,
  TabVersion,
} from "~/types/tab";

const API_BASE = "http://localhost:3000";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

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

async function tryRefresh(): Promise<boolean> {
  const refreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

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
    register: (data: {
      email: string;
      username: string;
      password: string;
      displayName?: string;
    }) =>
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
    update: (id: string, data: { displayName?: string; avatarUrl?: string }) =>
      request<User>(`/api/users/${id}`, { method: "PUT", body: data }),
  },
  tabs: {
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      userId?: string;
    }) => {
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
      return request<TabListResponse>(
        `/api/tabs/my${query ? `?${query}` : ""}`,
      );
    },
    get: (id: string) => request<TabDetail>(`/api/tabs/${id}`),
    create: (data: {
      title: string;
      artist?: string;
      content: TabDocument;
      isPublic?: boolean;
    }) => request<TabDetail>("/api/tabs", { method: "POST", body: data }),
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
    delete: (id: string) =>
      request<void>(`/api/tabs/${id}`, { method: "DELETE" }),
    fork: (id: string) =>
      request<TabDetail>(`/api/tabs/${id}/fork`, { method: "POST" }),
    versions: (id: string) => request<TabVersion[]>(`/api/tabs/${id}/versions`),
    togglePublish: (id: string) =>
      request<TabDetail>(`/api/tabs/${id}/publish`, { method: "POST" }),
  },
};
