import { Controller, Inject } from "@nestjs/common";
import { ClientProxy, MessagePattern, Payload } from "@nestjs/microservices";
import { JAM_EVENTS } from "@tone-knob/shared";

import { JamRoomService } from "./jam-room/jam-room.service";

@Controller()
export class JamSvcController {
  constructor(
    private readonly jamRoomService: JamRoomService,
    @Inject("MARKETPLACE_SERVICE")
    private readonly marketplaceClient: ClientProxy,
  ) {}

  @MessagePattern("jam.create")
  async create(
    @Payload()
    data: {
      hostId: string;
      dto: {
        name: string;
        description?: string;
        tabId?: string;
        maxParticipants?: number;
        isPrivate?: boolean;
        password?: string;
        bpm?: number;
      };
    },
  ) {
    return this.jamRoomService.create(data.hostId, data.dto);
  }

  @MessagePattern("jam.findAll")
  async findAll(@Payload() data: { page?: number; limit?: number; isActive?: boolean }) {
    return this.jamRoomService.findAll(data);
  }

  @MessagePattern("jam.findOne")
  async findOne(@Payload() data: { id: string }) {
    return this.jamRoomService.findOne(data.id);
  }

  @MessagePattern("jam.join")
  async join(@Payload() data: { roomId: string; userId: string; password?: string }) {
    const { participant, isNew } = await this.jamRoomService.join(
      data.roomId,
      data.userId,
      data.password,
    );

    if (isNew) {
      this.marketplaceClient.emit(JAM_EVENTS.PARTICIPANT_JOINED, {
        userId: data.userId,
        roomId: data.roomId,
      });
    }

    return participant;
  }

  @MessagePattern("jam.leave")
  async leave(@Payload() data: { roomId: string; userId: string }) {
    await this.jamRoomService.leave(data.roomId, data.userId);
    return { message: "합주방에서 나갔습니다" };
  }

  @MessagePattern("jam.participants")
  async getParticipants(@Payload() data: { roomId: string }) {
    return this.jamRoomService.getParticipants(data.roomId);
  }

  @MessagePattern("jam.close")
  async close(@Payload() data: { roomId: string; userId: string }) {
    await this.jamRoomService.close(data.roomId, data.userId);
    return { message: "합주방을 닫았습니다" };
  }
}
