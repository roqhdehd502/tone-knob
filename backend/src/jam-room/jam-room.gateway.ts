import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { JamRoomService } from './jam-room.service';

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
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  },
  namespace: '/jam',
})
export class JamRoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(JamRoomGateway.name);
  private userSocketMap = new Map<string, string>(); // userId -> socketId
  private socketUserMap = new Map<string, string>(); // socketId -> userId
  private socketRoomMap = new Map<string, string>(); // socketId -> roomId

  constructor(private readonly jamRoomService: JamRoomService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userId = this.socketUserMap.get(client.id);
    const roomId = this.socketRoomMap.get(client.id);

    if (userId && roomId) {
      // 참가자 연결 상태 업데이트
      try {
        await this.jamRoomService.updateParticipant(roomId, userId, {
          isConnected: false,
        });

        // 다른 참가자들에게 알림
        client.to(roomId).emit('user-disconnected', { userId });
      } catch (error) {
        this.logger.error('Error handling disconnect:', error);
      }
    }

    this.userSocketMap.delete(userId || '');
    this.socketUserMap.delete(client.id);
    this.socketRoomMap.delete(client.id);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = data;

    try {
      // 소켓 매핑 저장
      this.userSocketMap.set(userId, client.id);
      this.socketUserMap.set(client.id, userId);
      this.socketRoomMap.set(client.id, roomId);

      // Socket.IO 룸 참가
      await client.join(roomId);

      // DB 업데이트
      await this.jamRoomService.updateParticipant(roomId, userId, {
        socketId: client.id,
        isConnected: true,
      });

      // 현재 참가자 목록 조회
      const participants = await this.jamRoomService.getParticipants(roomId);

      // 새 참가자에게 현재 참가자 목록 전송
      client.emit('room-joined', {
        roomId,
        participants: participants.map((p) => ({
          userId: p.userId,
          username: p.user?.username,
          isMuted: p.isMuted,
          volume: p.volume,
        })),
      });

      // 기존 참가자들에게 새 참가자 알림
      client.to(roomId).emit('user-joined', {
        userId,
        socketId: client.id,
      });

      this.logger.log(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      this.logger.error('Error joining room:', error);
      client.emit('error', { message: '합주방 참가 실패' });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketUserMap.get(client.id);
    const { roomId } = data;

    if (!userId) return;

    try {
      await client.leave(roomId);
      await this.jamRoomService.leave(roomId, userId);

      client.to(roomId).emit('user-left', { userId });

      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      this.socketRoomMap.delete(client.id);

      this.logger.log(`User ${userId} left room ${roomId}`);
    } catch (error) {
      this.logger.error('Error leaving room:', error);
    }
  }

  @SubscribeMessage('webrtc-offer')
  handleOffer(
    @MessageBody() data: SignalPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, targetUserId, signal } = data;
    const fromUserId = this.socketUserMap.get(client.id);

    if (targetUserId) {
      // 특정 사용자에게 전송
      const targetSocketId = this.userSocketMap.get(targetUserId);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('webrtc-offer', {
          fromUserId,
          signal,
        });
      }
    } else {
      // 방의 모든 사용자에게 브로드캐스트
      client.to(roomId).emit('webrtc-offer', {
        fromUserId,
        signal,
      });
    }
  }

  @SubscribeMessage('webrtc-answer')
  handleAnswer(
    @MessageBody() data: SignalPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { targetUserId, signal } = data;
    const fromUserId = this.socketUserMap.get(client.id);

    if (targetUserId) {
      const targetSocketId = this.userSocketMap.get(targetUserId);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('webrtc-answer', {
          fromUserId,
          signal,
        });
      }
    }
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleIceCandidate(
    @MessageBody() data: SignalPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { targetUserId, signal } = data;
    const fromUserId = this.socketUserMap.get(client.id);

    if (targetUserId) {
      const targetSocketId = this.userSocketMap.get(targetUserId);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('webrtc-ice-candidate', {
          fromUserId,
          signal,
        });
      }
    }
  }

  @SubscribeMessage('toggle-mute')
  async handleToggleMute(
    @MessageBody() data: { roomId: string; isMuted: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketUserMap.get(client.id);
    const { roomId, isMuted } = data;

    if (!userId) return;

    try {
      await this.jamRoomService.updateParticipant(roomId, userId, { isMuted });
      client.to(roomId).emit('user-muted', { userId, isMuted });
    } catch (error) {
      this.logger.error('Error toggling mute:', error);
    }
  }

  @SubscribeMessage('update-volume')
  async handleUpdateVolume(
    @MessageBody() data: { roomId: string; volume: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketUserMap.get(client.id);
    const { roomId, volume } = data;

    if (!userId) return;

    try {
      await this.jamRoomService.updateParticipant(roomId, userId, { volume });
      client.to(roomId).emit('user-volume-changed', { userId, volume });
    } catch (error) {
      this.logger.error('Error updating volume:', error);
    }
  }

  @SubscribeMessage('sync-playback')
  handleSyncPlayback(
    @MessageBody()
    data: { roomId: string; position: number; isPlaying: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, position, isPlaying } = data;
    const userId = this.socketUserMap.get(client.id);

    client.to(roomId).emit('playback-synced', {
      fromUserId: userId,
      position,
      isPlaying,
    });
  }

  @SubscribeMessage('chat-message')
  handleChatMessage(
    @MessageBody()
    data: { roomId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketUserMap.get(client.id);
    const { roomId, message } = data;

    if (!userId || !message.trim()) return;

    const chatMessage = {
      id: `${Date.now()}-${userId}`,
      userId,
      message: message.trim().slice(0, 500),
      timestamp: new Date().toISOString(),
    };

    // 본인 포함 방 전체에 브로드캐스트
    this.server.to(roomId).emit('chat-message', chatMessage);
  }

  @SubscribeMessage('ping-latency')
  handlePingLatency(
    @MessageBody() data: { timestamp: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.emit('pong-latency', { timestamp: data.timestamp });
  }

  @SubscribeMessage('update-volume-for-user')
  handleUpdateVolumeForUser(
    @MessageBody()
    data: { roomId: string; targetUserId: string; volume: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketUserMap.get(client.id);
    const { roomId, targetUserId, volume } = data;

    if (!userId) return;

    // 볼륨 변경은 요청한 클라이언트에서만 로컬 처리
    // 서버는 다른 참가자에게 알림만 전송
    client.to(roomId).emit('volume-for-user-changed', {
      fromUserId: userId,
      targetUserId,
      volume,
    });
  }
}
