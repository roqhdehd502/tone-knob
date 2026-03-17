import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type OperationType = "insert" | "delete" | "update" | "cursor";

export interface CollabOperation {
  userId: string;
  serverRevision: number;
  type: OperationType;
  payload: Record<string, unknown>;
}

export interface CursorUpdate {
  userId: string;
  position: unknown;
}

export interface SessionState {
  revision: number;
  snapshot: Record<string, unknown> | null;
  activeUserIds: string[];
}

export type CollabStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

interface UseCollabEditorOptions {
  tabId: string;
  token: string | null;
  onOperation?: (op: CollabOperation) => void;
  onCursorUpdate?: (update: CursorUpdate) => void;
  onSessionState?: (state: SessionState) => void;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
}

interface UseCollabEditorReturn {
  status: CollabStatus;
  revision: number;
  activeUserIds: string[];
  sendOperation: (
    type: OperationType,
    payload: Record<string, unknown>,
  ) => void;
  sendCursor: (position: unknown) => void;
  saveSnapshot: (snapshot: Record<string, unknown>) => void;
  sync: (sinceRevision: number) => void;
}

export function useCollabEditor({
  tabId,
  token,
  onOperation,
  onCursorUpdate,
  onSessionState,
  onUserJoined,
  onUserLeft,
}: UseCollabEditorOptions): UseCollabEditorReturn {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<CollabStatus>("disconnected");
  const [revision, setRevision] = useState(0);
  const [activeUserIds, setActiveUserIds] = useState<string[]>([]);

  const revisionRef = useRef(revision);
  revisionRef.current = revision;

  useEffect(() => {
    if (!token || !tabId) return;

    setStatus("connecting");

    const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
    const socket = io(`${apiUrl}/collab`, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      socket.emit("join", { tabId });
    });

    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));

    socket.on("session:state", (state: SessionState) => {
      setRevision(state.revision);
      setActiveUserIds(state.activeUserIds ?? []);
      onSessionState?.(state);
    });

    socket.on("operation:broadcast", (op: CollabOperation) => {
      setRevision(op.serverRevision);
      onOperation?.(op);
    });

    socket.on("operation:ack", (data: { serverRevision: number }) => {
      setRevision(data.serverRevision);
    });

    socket.on("cursor:update", (update: CursorUpdate) => {
      onCursorUpdate?.(update);
    });

    socket.on("user:joined", ({ userId }: { userId: string }) => {
      setActiveUserIds((prev) =>
        prev.includes(userId) ? prev : [...prev, userId],
      );
      onUserJoined?.(userId);
    });

    socket.on("user:left", ({ userId }: { userId: string }) => {
      setActiveUserIds((prev) => prev.filter((id) => id !== userId));
      onUserLeft?.(userId);
    });

    return () => {
      socket.disconnect();
      setStatus("disconnected");
    };
  }, [tabId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendOperation = useCallback(
    (type: OperationType, payload: Record<string, unknown>) => {
      socketRef.current?.emit("operation", {
        tabId,
        revision: revisionRef.current,
        type,
        payload,
      });
    },
    [tabId],
  );

  const sendCursor = useCallback(
    (position: unknown) => {
      socketRef.current?.emit("cursor", { tabId, position });
    },
    [tabId],
  );

  const saveSnapshot = useCallback(
    (snapshot: Record<string, unknown>) => {
      socketRef.current?.emit("snapshot", { tabId, snapshot });
    },
    [tabId],
  );

  const sync = useCallback(
    (sinceRevision: number) => {
      socketRef.current?.emit("sync", { tabId, sinceRevision });
    },
    [tabId],
  );

  return {
    status,
    revision,
    activeUserIds,
    sendOperation,
    sendCursor,
    saveSnapshot,
    sync,
  };
}
