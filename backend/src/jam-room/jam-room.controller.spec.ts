import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';

import { JamRoomController } from './jam-room.controller';
import { JamRoomService } from './jam-room.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  getParticipants: jest.fn(),
  close: jest.fn(),
};

describe('JamRoomController', () => {
  let controller: JamRoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JamRoomController],
      providers: [{ provide: JamRoomService, useValue: mockService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<JamRoomController>(JamRoomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', () => {
    const req = { user: { id: 'user-1' } };
    const dto = { name: 'Test Room' };
    controller.create(req, dto);
    expect(mockService.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('should call findOne', () => {
    controller.findOne('room-1');
    expect(mockService.findOne).toHaveBeenCalledWith('room-1');
  });

  it('should call getParticipants', () => {
    controller.getParticipants('room-1');
    expect(mockService.getParticipants).toHaveBeenCalledWith('room-1');
  });
});
