import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

import { OperationType } from "../entities/collab-operation.entity";
import { CollabService } from "./collab.service";

interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({ namespace: "/collab", cors: { origin: "*" } })
export class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly connections = new Map<string, { userId: string; tabId: string }>();

  constructor(
    private readonly collabService: CollabService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthSocket) {
    try {
      const token: string | undefined =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        void client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.userId = payload.sub;
    } catch {
      void client.disconnect();
    }
  }

  async handleDisconnect(client: AuthSocket) {
    const conn = this.connections.get(client.id);
    if (conn) {
      await this.collabService.leaveSession(conn.tabId, conn.userId);
      client.leave(`tab:${conn.tabId}`);
      this.server.to(`tab:${conn.tabId}`).emit("user:left", { userId: conn.userId });
      this.connections.delete(client.id);
    }
  }

  @SubscribeMessage("join")
  async handleJoin(@MessageBody() data: { tabId: string }, @ConnectedSocket() client: AuthSocket) {
    if (!client.userId) return;

    const session = await this.collabService.joinSession(data.tabId, client.userId);
    await client.join(`tab:${data.tabId}`);
    this.connections.set(client.id, { userId: client.userId, tabId: data.tabId });

    client.emit("session:state", {
      revision: session.revision,
      snapshot: session.snapshot,
      activeUserIds: session.activeUserIds,
    });

    client.to(`tab:${data.tabId}`).emit("user:joined", { userId: client.userId });
  }

  @SubscribeMessage("operation")
  async handleOperation(
    @MessageBody()
    data: {
      tabId: string;
      revision: number;
      type: OperationType;
      payload: Record<string, unknown>;
    },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.userId) return;

    const result = await this.collabService.applyOperation(
      data.tabId,
      client.userId,
      data.revision,
      data.type,
      data.payload,
    );

    client.emit("operation:ack", {
      serverRevision: result.serverRevision,
      transformedPayload: result.transformedPayload,
    });

    client.to(`tab:${data.tabId}`).emit("operation:broadcast", {
      userId: client.userId,
      serverRevision: result.serverRevision,
      type: data.type,
      payload: result.transformedPayload ?? data.payload,
    });
  }

  @SubscribeMessage("cursor")
  handleCursor(
    @MessageBody() data: { tabId: string; position: unknown },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.userId) return;
    client
      .to(`tab:${data.tabId}`)
      .emit("cursor:update", { userId: client.userId, position: data.position });
  }

  @SubscribeMessage("snapshot")
  async handleSnapshot(
    @MessageBody() data: { tabId: string; snapshot: Record<string, unknown> },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.userId) return;
    await this.collabService.saveSnapshot(data.tabId, data.snapshot);
    client.to(`tab:${data.tabId}`).emit("snapshot:saved", {
      revision: (await this.collabService.getSession(data.tabId)).revision,
    });
  }

  @SubscribeMessage("sync")
  async handleSync(
    @MessageBody() data: { tabId: string; sinceRevision: number },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.userId) return;
    const ops = await this.collabService.getOperationsSince(data.tabId, data.sinceRevision);
    client.emit("sync:response", { operations: ops });
  }
}
