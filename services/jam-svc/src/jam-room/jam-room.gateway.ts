import { Logger } from "@nestjs/common";
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

import { JamRoomService } from "./jam-room.service";

interface JoinRoomPayload {
  roomId: string;
  userId: string;
}

interface SignalPayload {
  roomId: string;
  targetUserId?: string;
  signal: unknown;
}

@WebSocketGateway({
  cors: { origin: "*", credentials: true },
  namespace: "/jam",
})
export class JamRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(JamRoomGateway.name);
  private userSocketMap = new Map<string, string>();
  private socketUserMap = new Map<string, string>();
  private socketRoomMap = new Map<string, string>();

  constructor(private readonly jamRoomService: JamRoomService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = this.socketUserMap.get(client.id);
    const roomId = this.socketRoomMap.get(client.id);

    if (userId && roomId) {
      try {
        await this.jamRoomService.updateParticipant(roomId, userId, { isConnected: false });
        client.to(roomId).emit("user-disconnected", { userId });
      } catch (error) {
        this.logger.error("Error handling disconnect:", error);
      }
    }

    this.userSocketMap.delete(userId || "");
    this.socketUserMap.delete(client.id);
    this.socketRoomMap.delete(client.id);
  }

  @SubscribeMessage("join-room")
  async handleJoinRoom(@MessageBody() data: JoinRoomPayload, @ConnectedSocket() client: Socket) {
    const { roomId, userId } = data;
    try {
      this.userSocketMap.set(userId, client.id);
      this.socketUserMap.set(client.id, userId);
      this.socketRoomMap.set(client.id, roomId);

      await client.join(roomId);
      await this.jamRoomService.updateParticipant(roomId, userId, {
        socketId: client.id,
        isConnected: true,
      });

      const participants = await this.jamRoomService.getParticipants(roomId);
      client.emit("room-joined", {
        roomId,
        participants: participants.map((p) => ({
          userId: p.userId,
          username: p.user?.username,
          isMuted: p.isMuted,
          volume: p.volume,
        })),
      });

      client.to(roomId).emit("user-joined", { userId, socketId: client.id });
      this.logger.log(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      this.logger.error("Error joining room:", error);
      client.emit("error", { message: "\ud569\uc8fc\ubc29 \ucc38\uac00 \uc2e4\ud328" });
    }
  }

  @SubscribeMessage("leave-room")
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketUserMap.get(client.id);
    if (!userId) return;
    try {
      await client.leave(data.roomId);
      await this.jamRoomService.leave(data.roomId, userId);
      client.to(data.roomId).emit("user-left", { userId });
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      this.socketRoomMap.delete(client.id);
    } catch (error) {
      this.logger.error("Error leaving room:", error);
    }
  }

  @SubscribeMessage("webrtc-offer")
  handleOffer(@MessageBody() data: SignalPayload, @ConnectedSocket() client: Socket) {
    const fromUserId = this.socketUserMap.get(client.id);
    if (data.targetUserId) {
      const targetSocketId = this.userSocketMap.get(data.targetUserId);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit("webrtc-offer", { fromUserId, signal: data.signal });
      }
    } else {
      client.to(data.roomId).emit("webrtc-offer", { fromUserId, signal: data.signal });
    }
  }

  @SubscribeMessage("webrtc-answer")
  handleAnswer(@MessageBody() data: SignalPayload, @ConnectedSocket() client: Socket) {
    const fromUserId = this.socketUserMap.get(client.id);
    if (data.targetUserId) {
      const targetSocketId = this.userSocketMap.get(data.targetUserId);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit("webrtc-answer", { fromUserId, signal: data.signal });
      }
    }
  }

  @SubscribeMessage("webrtc-ice-candidate")
  handleIceCandidate(@MessageBody() data: SignalPayload, @ConnectedSocket() client: Socket) {
    const fromUserId = this.socketUserMap.get(client.id);
    if (data.targetUserId) {
      const targetSocketId = this.userSocketMap.get(data.targetUserId);
      if (targetSocketId) {
        this.server
          .to(targetSocketId)
          .emit("webrtc-ice-candidate", { fromUserId, signal: data.signal });
      }
    }
  }

  @SubscribeMessage("toggle-mute")
  async handleToggleMute(
    @MessageBody() data: { roomId: string; isMuted: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketUserMap.get(client.id);
    if (!userId) return;
    try {
      await this.jamRoomService.updateParticipant(data.roomId, userId, { isMuted: data.isMuted });
      client.to(data.roomId).emit("user-muted", { userId, isMuted: data.isMuted });
    } catch (error) {
      this.logger.error("Error toggling mute:", error);
    }
  }

  @SubscribeMessage("sync-playback")
  handleSyncPlayback(
    @MessageBody() data: { roomId: string; position: number; isPlaying: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketUserMap.get(client.id);
    client.to(data.roomId).emit("playback-synced", {
      fromUserId: userId,
      position: data.position,
      isPlaying: data.isPlaying,
    });
  }

  @SubscribeMessage("chat-message")
  handleChatMessage(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketUserMap.get(client.id);
    if (!userId || !data.message.trim()) return;
    const chatMessage = {
      id: `${Date.now()}-${userId}`,
      userId,
      message: data.message.trim().slice(0, 500),
      timestamp: new Date().toISOString(),
    };
    this.server.to(data.roomId).emit("chat-message", chatMessage);
  }

  @SubscribeMessage("ping-latency")
  handlePingLatency(@MessageBody() data: { timestamp: number }, @ConnectedSocket() client: Socket) {
    client.emit("pong-latency", { timestamp: data.timestamp });
  }
}
