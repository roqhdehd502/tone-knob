import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { JamRoomService } from './jam-room/jam-room.service';

@Controller()
export class JamSvcController {
  constructor(private readonly jamRoomService: JamRoomService) {}

  @MessagePattern('jam.create')
  async create(
    @Payload() data: { hostId: string; dto: { name: string; description?: string; tabId?: string; maxParticipants?: number; isPrivate?: boolean; password?: string; bpm?: number } },
  ) {
    return this.jamRoomService.create(data.hostId, data.dto);
  }

  @MessagePattern('jam.findAll')
  async findAll(@Payload() data: { page?: number; limit?: number; isActive?: boolean }) {
    return this.jamRoomService.findAll(data);
  }

  @MessagePattern('jam.findOne')
  async findOne(@Payload() data: { id: string }) {
    return this.jamRoomService.findOne(data.id);
  }

  @MessagePattern('jam.join')
  async join(@Payload() data: { roomId: string; userId: string; password?: string }) {
    return this.jamRoomService.join(data.roomId, data.userId, data.password);
  }

  @MessagePattern('jam.leave')
  async leave(@Payload() data: { roomId: string; userId: string }) {
    await this.jamRoomService.leave(data.roomId, data.userId);
    return { message: '합주방에서 나갔습니다' };
  }

  @MessagePattern('jam.participants')
  async getParticipants(@Payload() data: { roomId: string }) {
    return this.jamRoomService.getParticipants(data.roomId);
  }

  @MessagePattern('jam.close')
  async close(@Payload() data: { roomId: string; userId: string }) {
    await this.jamRoomService.close(data.roomId, data.userId);
    return { message: '합주방을 닫았습니다' };
  }
}
