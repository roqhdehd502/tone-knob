import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomService } from './room.service';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createRoom(@CurrentUser() user: AuthUser, @Body() dto: CreateRoomDto) {
    const room = this.roomService.createRoom({
      hostId: user.userId,
      hostEmail: user.email,
      name: dto.name,
      bpm: dto.bpm,
      key: dto.key,
      timeSignature: dto.time_signature,
      syncMode: dto.sync_mode,
      isPublic: dto.is_public,
    });

    return { room_id: room.id };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':roomId')
  getRoom(@Param('roomId') roomId: string) {
    const room = this.roomService.getRoom(roomId);
    return {
      room_info: this.roomService.toRoomResponse(room),
      participants: Array.from(room.participants.values()),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':roomId/join')
  joinRoom(@CurrentUser() user: AuthUser, @Param('roomId') roomId: string) {
    const { sessionId } = this.roomService.joinRoom(roomId, user);
    return { session_id: sessionId };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':roomId/leave')
  leaveRoom(@CurrentUser() user: AuthUser, @Param('roomId') roomId: string) {
    this.roomService.leaveRoom(roomId, user.userId);
    return { success: true };
  }
}
