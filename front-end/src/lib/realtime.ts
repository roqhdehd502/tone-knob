import { REALTIME_WS_URL } from "./env";

export type RealtimeEvent = {
  type: string;
  [key: string]: unknown;
};

export class RealtimeClient {
  private ws?: WebSocket;

  connect(params?: { token?: string }) {
    const url = new URL(REALTIME_WS_URL);
    if (params?.token) url.searchParams.set("token", params.token);

    this.ws = new WebSocket(url.toString());
  }

  disconnect() {
    this.ws?.close();
    this.ws = undefined;
  }

  onOpen(cb: () => void) {
    this.ws?.addEventListener("open", cb);
  }

  onClose(cb: () => void) {
    this.ws?.addEventListener("close", cb);
  }

  onMessage(cb: (event: RealtimeEvent) => void) {
    this.ws?.addEventListener("message", (e) => {
      try {
        const parsed = JSON.parse(String(e.data)) as unknown;
        if (!parsed || typeof parsed !== "object") return;
        if (
          !("type" in parsed) ||
          typeof (parsed as { type?: unknown }).type !== "string"
        ) {
          return;
        }
        cb(parsed as RealtimeEvent);
      } catch {
        // ignore
      }
    });
  }

  send(event: RealtimeEvent) {
    if (!this.ws) return;
    if (this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(event));
  }

  joinRoom(roomId: string) {
    this.send({ type: "room:join", roomId });
  }

  leaveRoom() {
    this.send({ type: "room:leave" });
  }

  ping() {
    this.send({ type: "ping" });
  }
}
