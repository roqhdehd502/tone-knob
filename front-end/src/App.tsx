import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import type { ApiError, RoomParticipant } from "./lib/api";
import {
  createRoom,
  getMe,
  getRoom,
  joinRoom,
  leaveRoom,
  login,
  register,
  updateProfile,
} from "./lib/api";
import { RealtimeClient, type RealtimeEvent } from "./lib/realtime";

type AuthState = {
  token: string;
  email: string;
};

function isApiError(err: unknown): err is ApiError {
  return (
    !!err &&
    typeof err === "object" &&
    "status" in err &&
    "message" in err &&
    typeof (err as { status?: unknown }).status === "number" &&
    typeof (err as { message?: unknown }).message === "string"
  );
}

function App() {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const token = localStorage.getItem("tk_token");
    const email = localStorage.getItem("tk_email");
    if (!token || !email) return null;
    return { token, email };
  });
  const token = auth?.token ?? null;
  const authEmail = auth?.email ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<{
    email: string;
    nickname?: string;
    instrument?: string;
  } | null>(null);
  const [nickname, setNickname] = useState("");
  const [instrument, setInstrument] = useState("");

  const [roomName, setRoomName] = useState("My Room");
  const [roomBpm, setRoomBpm] = useState(120);
  const [roomId, setRoomId] = useState<string>("");
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const joinedRoomIdRef = useRef<string | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsLog, setWsLog] = useState<string[]>([]);

  const rt = useMemo(() => new RealtimeClient(), []);

  useEffect(() => {
    joinedRoomIdRef.current = joinedRoomId;
  }, [joinedRoomId]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await getMe(token);
        if (cancelled) return;
        setMe({
          email: data.email,
          nickname: data.nickname,
          instrument: data.instrument,
        });
        setNickname(data.nickname ?? "");
        setInstrument(data.instrument ?? "");
      } catch (e) {
        if (cancelled) return;
        setError(isApiError(e) ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function refreshRoom(rid: string) {
    if (!token) return;
    const data = await getRoom(token, rid);
    setParticipants(data.participants);
  }

  function pushWsLog(line: string) {
    setWsLog((prev) => [line, ...prev].slice(0, 50));
  }

  function connectRealtime() {
    rt.connect();
    rt.onOpen(() => {
      setWsConnected(true);
      pushWsLog("ws: open");
    });
    rt.onClose(() => {
      setWsConnected(false);
      pushWsLog("ws: close");
    });
    rt.onMessage((ev: RealtimeEvent) => {
      pushWsLog(`ws: ${ev.type}`);
      const rid = joinedRoomIdRef.current;
      if (rid) {
        void refreshRoom(rid);
      }
    });
  }

  async function handleRegister() {
    setError(null);
    try {
      const res = await register(email, password);
      localStorage.setItem("tk_token", res.token);
      localStorage.setItem("tk_email", email);
      setAuth({ token: res.token, email });
    } catch (e) {
      setError(isApiError(e) ? e.message : String(e));
    }
  }

  async function handleLogin() {
    setError(null);
    try {
      const res = await login(email, password);
      localStorage.setItem("tk_token", res.token);
      localStorage.setItem("tk_email", email);
      setAuth({ token: res.token, email });
    } catch (e) {
      setError(isApiError(e) ? e.message : String(e));
    }
  }

  function handleLogout() {
    localStorage.removeItem("tk_token");
    localStorage.removeItem("tk_email");
    setAuth(null);
    setMe(null);
    setNickname("");
    setInstrument("");
    setJoinedRoomId(null);
    setParticipants([]);
    setWsLog([]);
    rt.disconnect();
  }

  async function handleUpdateProfile() {
    if (!token) return;
    setError(null);
    try {
      const res = await updateProfile(token, {
        nickname: nickname || undefined,
        instrument: instrument || undefined,
      });
      setMe({
        email: res.email,
        nickname: res.nickname,
        instrument: res.instrument,
      });
    } catch (e) {
      setError(isApiError(e) ? e.message : String(e));
    }
  }

  async function handleCreateRoom() {
    if (!token) return;
    setError(null);
    try {
      const res = await createRoom(token, {
        name: roomName,
        bpm: roomBpm,
        sync_mode: "metronome",
        is_public: true,
      });
      setRoomId(res.room_id);
    } catch (e) {
      setError(isApiError(e) ? e.message : String(e));
    }
  }

  async function handleJoinRoom() {
    if (!token) return;
    if (!roomId) return;
    setError(null);

    try {
      await joinRoom(token, roomId);

      if (!wsConnected) {
        connectRealtime();
      }

      setJoinedRoomId(roomId);
      await refreshRoom(roomId);
      rt.joinRoom(roomId);
    } catch (e) {
      setError(isApiError(e) ? e.message : String(e));
    }
  }

  async function handleLeaveRoom() {
    if (!token) return;
    if (!joinedRoomId) return;
    setError(null);

    try {
      rt.leaveRoom();
      rt.disconnect();
      await leaveRoom(token, joinedRoomId);
      setJoinedRoomId(null);
      setParticipants([]);
      setWsLog([]);
    } catch (e) {
      setError(isApiError(e) ? e.message : String(e));
    }
  }

  return (
    <div style={{ textAlign: "left" }}>
      <h1>Tone Knob (MVP)</h1>

      {error ? (
        <div
          style={{
            padding: 12,
            background: "#2a1b1b",
            border: "1px solid #7a2b2b",
            marginBottom: 12,
          }}
        >
          <strong>Error</strong>: {error}
        </div>
      ) : null}

      {!token ? (
        <section className="card" style={{ textAlign: "left" }}>
          <h2>Auth</h2>
          <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
            <label>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleRegister}>Register</button>
              <button onClick={handleLogin}>Login</button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="card" style={{ textAlign: "left" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>Me</h2>
              <button onClick={handleLogout}>Logout</button>
            </div>
            <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
              <div>
                <strong>Email</strong>: {me?.email ?? authEmail}
              </div>
              <label>
                Nickname
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={{ width: "100%" }}
                />
              </label>
              <label>
                Instrument
                <input
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  style={{ width: "100%" }}
                />
              </label>
              <div>
                <button onClick={handleUpdateProfile}>Save Profile</button>
              </div>
            </div>
          </section>

          <section className="card" style={{ textAlign: "left" }}>
            <h2>Room</h2>
            <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
              <label>
                Room Name
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  style={{ width: "100%" }}
                />
              </label>
              <label>
                BPM
                <input
                  type="number"
                  value={roomBpm}
                  onChange={(e) =>
                    setRoomBpm(Number.parseInt(e.target.value || "120", 10))
                  }
                  style={{ width: "100%" }}
                />
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={handleCreateRoom}>Create Room</button>
                {roomId ? (
                  <span>
                    <strong>room_id</strong>: <code>{roomId}</code>
                  </span>
                ) : null}
              </div>

              <label>
                Join Room ID
                <input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  style={{ width: "100%" }}
                />
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleJoinRoom}
                  disabled={!roomId || !!joinedRoomId}
                >
                  Join
                </button>
                <button onClick={handleLeaveRoom} disabled={!joinedRoomId}>
                  Leave
                </button>
              </div>
            </div>
          </section>

          <section className="card" style={{ textAlign: "left" }}>
            <h2>Lobby</h2>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <strong>joinedRoomId</strong>: {joinedRoomId ?? "-"}
              </div>
              <div>
                <strong>ws</strong>:{" "}
                {wsConnected ? "connected" : "disconnected"}
              </div>

              <div>
                <strong>participants</strong>
                <div style={{ marginTop: 6 }}>
                  {participants.length === 0 ? (
                    <div style={{ opacity: 0.7 }}>-</div>
                  ) : (
                    <ul>
                      {participants.map((p) => (
                        <li key={p.userId}>
                          {p.email} ({p.role})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <strong>ws log</strong>
                <div
                  style={{
                    marginTop: 6,
                    maxHeight: 160,
                    overflow: "auto",
                    fontFamily: "monospace",
                  }}
                >
                  {wsLog.length === 0 ? (
                    <div style={{ opacity: 0.7 }}>-</div>
                  ) : (
                    <ul>
                      {wsLog.map((line, idx) => (
                        <li key={`${idx}:${line}`}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default App;
