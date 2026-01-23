import { API_BASE_URL } from "./env";

export type ApiError = {
  status: number;
  message: string;
};

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as unknown;
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
    ) {
      return (data as { message: string }).message;
    }
  } catch {
    // ignore
  }

  return `${res.status} ${res.statusText}`;
}

async function requestJson<T>(
  path: string,
  opts: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const msg = await readErrorMessage(res);
    const err: ApiError = { status: res.status, message: msg };
    throw err;
  }

  return (await res.json()) as T;
}

export type AuthResponse = { user_id: string; token: string };

export async function register(email: string, password: string) {
  return requestJson<AuthResponse>("/auth/register", {
    method: "POST",
    body: { email, password },
  });
}

export async function login(email: string, password: string) {
  return requestJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export type MeResponse = {
  id: string;
  email: string;
  nickname?: string;
  instrument?: string;
};

export async function getMe(token: string) {
  return requestJson<MeResponse>("/user/me", { token });
}

export async function updateProfile(
  token: string,
  input: { nickname?: string; instrument?: string },
) {
  return requestJson<MeResponse>("/user/profile", {
    method: "PUT",
    token,
    body: input,
  });
}

export type CreateRoomInput = {
  name: string;
  bpm: number;
  key?: string;
  time_signature?: string;
  sync_mode?: "metronome" | "free";
  is_public?: boolean;
};

export async function createRoom(token: string, input: CreateRoomInput) {
  return requestJson<{ room_id: string }>("/room", {
    method: "POST",
    token,
    body: input,
  });
}

export type RoomParticipant = {
  userId: string;
  email: string;
  role: "host" | "player";
};

export type RoomInfo = {
  id: string;
  name: string;
  bpm: number;
  key?: string;
  time_signature?: string;
  sync_mode: "metronome" | "free";
  host_id: string;
  is_public: boolean;
  max_participants: number;
  participants: RoomParticipant[];
};

export async function getRoom(token: string, roomId: string) {
  return requestJson<{ room_info: RoomInfo; participants: RoomParticipant[] }>(
    `/room/${encodeURIComponent(roomId)}`,
    { token },
  );
}

export async function joinRoom(token: string, roomId: string) {
  return requestJson<{ session_id: string }>(
    `/room/${encodeURIComponent(roomId)}/join`,
    { method: "POST", token },
  );
}

export async function leaveRoom(token: string, roomId: string) {
  return requestJson<{ success: true }>(
    `/room/${encodeURIComponent(roomId)}/leave`,
    { method: "POST", token },
  );
}
