import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { type RawData, WebSocket, WebSocketServer } from "ws";

type Client = {
  id: string;
  ws: WebSocket;
  roomId?: string;
};

type InboundMessage = Record<string, unknown> & { type: string };

const port = Number.parseInt(process.env.PORT ?? "3001", 10);

const server = http.createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/health") {
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.statusCode = 404;
    res.end("Not Found");
  },
);

const wss = new WebSocketServer({ server, path: "/ws" });

const rooms = new Map<string, Set<Client>>();

function broadcast(roomId: string, payload: unknown, exceptClientId?: string) {
  const clients = rooms.get(roomId);
  if (!clients) return;

  const data = JSON.stringify(payload);
  for (const client of clients) {
    if (exceptClientId && client.id === exceptClientId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

function removeFromRoom(client: Client) {
  if (!client.roomId) return;

  const roomId = client.roomId;
  const clients = rooms.get(roomId);
  if (clients) {
    clients.delete(client);
    if (clients.size === 0) rooms.delete(roomId);
  }

  client.roomId = undefined;
}

function addToRoom(client: Client, roomId: string) {
  removeFromRoom(client);

  const clients = rooms.get(roomId) ?? new Set<Client>();
  clients.add(client);
  rooms.set(roomId, clients);
  client.roomId = roomId;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function randomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function rawDataToString(raw: RawData): string {
  if (typeof raw === "string") return raw;
  if (Buffer.isBuffer(raw)) return raw.toString("utf-8");
  if (Array.isArray(raw)) return Buffer.concat(raw).toString("utf-8");
  return Buffer.from(raw).toString("utf-8");
}

wss.on("connection", (ws: WebSocket) => {
  const client: Client = { id: randomId(), ws };

  ws.send(JSON.stringify({ type: "connected", clientId: client.id }));

  ws.on("message", (raw: RawData) => {
    const text = rawDataToString(raw);
    const parsed = safeJsonParse(text);
    if (!parsed || typeof parsed !== "object") return;

    const msg = parsed as Record<string, unknown>;
    const msgType = msg.type;
    if (typeof msgType !== "string") return;

    if (msgType === "ping") {
      ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
      return;
    }

    if (msgType === "room:join") {
      const roomId = msg.roomId;
      if (typeof roomId !== "string") return;

      addToRoom(client, roomId);
      ws.send(JSON.stringify({ type: "room:joined", roomId }));
      broadcast(
        roomId,
        { type: "room:peer-joined", clientId: client.id },
        client.id,
      );
      return;
    }

    if (msgType === "room:leave") {
      if (client.roomId) {
        const roomId = client.roomId;
        removeFromRoom(client);
        ws.send(JSON.stringify({ type: "room:left", roomId }));
        broadcast(
          roomId,
          { type: "room:peer-left", clientId: client.id },
          client.id,
        );
      }
      return;
    }

    if (client.roomId) {
      const passthrough: InboundMessage = {
        ...(msg as Record<string, unknown>),
        type: msgType,
      };
      broadcast(
        client.roomId,
        { ...passthrough, clientId: client.id },
        client.id,
      );
    }
  });

  ws.on("close", () => {
    if (client.roomId) {
      const roomId = client.roomId;
      removeFromRoom(client);
      broadcast(
        roomId,
        { type: "room:peer-left", clientId: client.id },
        client.id,
      );
    }
  });
});

server.listen(port, () => {
  process.stdout.write(`real-time ws server listening on :${port}\n`);
});
