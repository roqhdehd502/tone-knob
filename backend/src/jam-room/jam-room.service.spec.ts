import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { JamParticipant } from '../entities/jam-participant.entity';
import { JamRoom } from '../entities/jam-room.entity';
import { JamRoomService } from './jam-room.service';

const mockRoom = (overrides: Partial<JamRoom> = {}): JamRoom =>
  ({
    id: 'room-1',
    name: 'Test Room',
    hostId: 'user-1',
    maxParticipants: 4,
    currentParticipants: 1,
    isActive: true,
    isPrivate: false,
    password: null,
    bpm: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as JamRoom;

describe('JamRoomService', () => {
  let service: JamRoomService;
  let roomRepo: Record<string, jest.Mock>;
  let participantRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    roomRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'room-1', ...entity })),
      findOne: jest.fn(),
      increment: jest.fn().mockResolvedValue(undefined),
      decrement: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };

    participantRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'part-1', ...entity })),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JamRoomService,
        { provide: getRepositoryToken(JamRoom), useValue: roomRepo },
        {
          provide: getRepositoryToken(JamParticipant),
          useValue: participantRepo,
        },
      ],
    }).compile();

    service = module.get<JamRoomService>(JamRoomService);
  });

  describe('create', () => {
    it('should create a room and add host as participant', async () => {
      const result = await service.create('user-1', {
        name: 'My Room',
        bpm: 140,
      });

      expect(roomRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: 'user-1',
          name: 'My Room',
          bpm: 140,
          currentParticipants: 1,
        }),
      );
      expect(participantRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a room if found', async () => {
      const room = mockRoom();
      roomRepo.findOne.mockResolvedValue(room);

      const result = await service.findOne('room-1');
      expect(result).toEqual(room);
    });

    it('should throw NotFoundException if not found', async () => {
      roomRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('join', () => {
    it('should add a new participant', async () => {
      roomRepo.findOne.mockResolvedValue(mockRoom());
      participantRepo.findOne.mockResolvedValue(null);

      const result = await service.join('room-1', 'user-2');

      expect(participantRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ roomId: 'room-1', userId: 'user-2' }),
      );
      expect(roomRepo.increment).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should reconnect existing participant', async () => {
      roomRepo.findOne.mockResolvedValue(mockRoom());
      const existing = {
        roomId: 'room-1',
        userId: 'user-2',
        isConnected: false,
      };
      participantRepo.findOne.mockResolvedValue(existing);

      await service.join('room-1', 'user-2');

      expect(participantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isConnected: true }),
      );
      expect(roomRepo.increment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if room is inactive', async () => {
      roomRepo.findOne.mockResolvedValue(mockRoom({ isActive: false }));

      await expect(service.join('room-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if room is full', async () => {
      roomRepo.findOne.mockResolvedValue(
        mockRoom({ currentParticipants: 4, maxParticipants: 4 }),
      );

      await expect(service.join('room-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException for wrong password', async () => {
      roomRepo.findOne.mockResolvedValue(
        mockRoom({ isPrivate: true, password: 'secret' }),
      );

      await expect(service.join('room-1', 'user-2', 'wrong')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('leave', () => {
    it('should remove participant and decrement count', async () => {
      participantRepo.findOne.mockResolvedValue({
        roomId: 'room-1',
        userId: 'user-2',
      });
      roomRepo.findOne.mockResolvedValue(mockRoom());

      await service.leave('room-1', 'user-2');

      expect(participantRepo.remove).toHaveBeenCalled();
      expect(roomRepo.decrement).toHaveBeenCalled();
    });

    it('should deactivate room when host leaves', async () => {
      participantRepo.findOne.mockResolvedValue({
        roomId: 'room-1',
        userId: 'user-1',
      });
      const room = mockRoom({ hostId: 'user-1' });
      roomRepo.findOne.mockResolvedValue(room);

      await service.leave('room-1', 'user-1');

      expect(roomRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });
  });

  describe('close', () => {
    it('should close room and remove all participants', async () => {
      roomRepo.findOne.mockResolvedValue(mockRoom({ hostId: 'user-1' }));

      await service.close('room-1', 'user-1');

      expect(roomRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(participantRepo.delete).toHaveBeenCalledWith({ roomId: 'room-1' });
    });

    it('should throw ForbiddenException if not the host', async () => {
      roomRepo.findOne.mockResolvedValue(mockRoom({ hostId: 'user-1' }));

      await expect(service.close('room-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
