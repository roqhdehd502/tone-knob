import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { JamParticipant } from '../entities/jam-participant.entity';
import { JamRoom } from '../entities/jam-room.entity';

@Injectable()
export class JamRoomService {
  constructor(
    @InjectRepository(JamRoom)
    private readonly jamRoomRepository: Repository<JamRoom>,
    @InjectRepository(JamParticipant)
    private readonly participantRepository: Repository<JamParticipant>,
  ) {}

  async create(
    hostId: string,
    dto: { name: string; description?: string; tabId?: string; maxParticipants?: number; isPrivate?: boolean; password?: string; bpm?: number },
  ): Promise<JamRoom> {
    const room = this.jamRoomRepository.create({
      hostId,
      name: dto.name,
      description: dto.description,
      tabId: dto.tabId,
      maxParticipants: dto.maxParticipants ?? 4,
      isPrivate: dto.isPrivate ?? false,
      password: dto.password,
      bpm: dto.bpm ?? 120,
      currentParticipants: 1,
      isActive: true,
    });
    const saved = await this.jamRoomRepository.save(room);

    const participant = this.participantRepository.create({
      roomId: saved.id,
      userId: hostId,
      isConnected: true,
    });
    await this.participantRepository.save(participant);

    return saved;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: JamRoom[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.jamRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.host', 'host')
      .where('room.isPrivate = :isPrivate', { isPrivate: false });

    if (query.isActive !== undefined) {
      qb.andWhere('room.isActive = :isActive', { isActive: query.isActive });
    }

    qb.orderBy('room.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<JamRoom> {
    const room = await this.jamRoomRepository.findOne({
      where: { id },
      relations: ['host'],
    });
    if (!room) {
      throw new RpcException({ statusCode: 404, message: '합주방을 찾을 수 없습니다' });
    }
    return room;
  }

  async join(
    roomId: string,
    userId: string,
    password?: string,
  ): Promise<{ participant: JamParticipant; isNew: boolean }> {
    const room = await this.findOne(roomId);

    if (!room.isActive) {
      throw new RpcException({ statusCode: 400, message: '비활성화된 합주방입니다' });
    }
    if (room.currentParticipants >= room.maxParticipants) {
      throw new RpcException({ statusCode: 400, message: '합주방이 가득 찼습니다' });
    }
    if (room.isPrivate && room.password !== password) {
      throw new RpcException({ statusCode: 403, message: '비밀번호가 올바르지 않습니다' });
    }

    const existing = await this.participantRepository.findOne({ where: { roomId, userId } });
    if (existing) {
      existing.isConnected = true;
      const participant = await this.participantRepository.save(existing);
      return { participant, isNew: false };
    }

    const participant = this.participantRepository.create({ roomId, userId, isConnected: true });
    await this.participantRepository.save(participant);
    await this.jamRoomRepository.increment({ id: roomId }, 'currentParticipants', 1);

    return { participant, isNew: true };
  }

  async leave(roomId: string, userId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({ where: { roomId, userId } });
    if (!participant) return;

    await this.participantRepository.remove(participant);
    await this.jamRoomRepository.decrement({ id: roomId }, 'currentParticipants', 1);

    const room = await this.findOne(roomId);
    if (room.hostId === userId) {
      room.isActive = false;
      await this.jamRoomRepository.save(room);
    }
  }

  async getParticipants(roomId: string): Promise<JamParticipant[]> {
    return this.participantRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async updateParticipant(
    roomId: string,
    userId: string,
    updates: { socketId?: string; isMuted?: boolean; volume?: number; isConnected?: boolean },
  ): Promise<JamParticipant> {
    const participant = await this.participantRepository.findOne({ where: { roomId, userId } });
    if (!participant) {
      throw new RpcException({ statusCode: 404, message: '참가자를 찾을 수 없습니다' });
    }
    Object.assign(participant, updates);
    return this.participantRepository.save(participant);
  }

  async close(roomId: string, userId: string): Promise<void> {
    const room = await this.findOne(roomId);
    if (room.hostId !== userId) {
      throw new RpcException({ statusCode: 403, message: '방을 닫을 권한이 없습니다' });
    }
    room.isActive = false;
    await this.jamRoomRepository.save(room);
    await this.participantRepository.delete({ roomId });
  }
}
