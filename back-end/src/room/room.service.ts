import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Room, RoomParticipant } from './room.types';

@Injectable()
export class RoomService {
  private readonly roomsById = new Map<string, Room>();

  createRoom(input: {
    hostId: string;
    hostEmail: string;
    name: string;
    bpm: number;
    key?: string;
    timeSignature?: string;
    syncMode?: 'metronome' | 'free';
    isPublic?: boolean;
  }) {
    const id = randomUUID();

    const participants = new Map<string, RoomParticipant>();
    participants.set(input.hostId, {
      userId: input.hostId,
      email: input.hostEmail,
      role: 'host',
    });

    const room: Room = {
      id,
      name: input.name,
      hostId: input.hostId,
      bpm: input.bpm,
      key: input.key,
      timeSignature: input.timeSignature,
      syncMode: input.syncMode ?? 'metronome',
      isPublic: input.isPublic ?? true,
      maxParticipants: 6,
      createdAt: Date.now(),
      participants,
    };

    this.roomsById.set(id, room);
    return room;
  }

  getRoom(roomId: string) {
    const room = this.roomsById.get(roomId);
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  joinRoom(roomId: string, user: { userId: string; email: string }) {
    const room = this.getRoom(roomId);

    if (room.participants.has(user.userId)) {
      return { room, sessionId: randomUUID() };
    }

    if (room.participants.size >= room.maxParticipants) {
      throw new ForbiddenException('Room is full');
    }

    room.participants.set(user.userId, {
      userId: user.userId,
      email: user.email,
      role: 'player',
    });

    return { room, sessionId: randomUUID() };
  }

  leaveRoom(roomId: string, userId: string) {
    const room = this.getRoom(roomId);

    if (!room.participants.has(userId)) return room;

    room.participants.delete(userId);

    if (userId === room.hostId) {
      this.roomsById.delete(roomId);
      return undefined;
    }

    return room;
  }

  toRoomResponse(room: Room) {
    return {
      id: room.id,
      name: room.name,
      bpm: room.bpm,
      key: room.key,
      time_signature: room.timeSignature,
      sync_mode: room.syncMode,
      host_id: room.hostId,
      is_public: room.isPublic,
      max_participants: room.maxParticipants,
      participants: Array.from(room.participants.values()),
    };
  }
}
