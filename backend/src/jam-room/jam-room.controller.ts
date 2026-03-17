import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { CreateJamRoomDto } from './dto/create-jam-room.dto';
import { JoinJamRoomDto } from './dto/join-jam-room.dto';
import { JamRoomService } from './jam-room.service';

@ApiTags('jam-rooms')
@Controller('api/jam-rooms')
@UseGuards(ThrottlerGuard)
export class JamRoomController {
  constructor(private readonly jamRoomService: JamRoomService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '합주방 생성' })
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateJamRoomDto,
  ) {
    return this.jamRoomService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '합주방 목록 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.jamRoomService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '합주방 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.jamRoomService.findOne(id);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '합주방 참가' })
  join(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: JoinJamRoomDto,
  ) {
    return this.jamRoomService.join(id, req.user.id, dto.password);
  }

  @Post(':id/leave')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '합주방 나가기' })
  async leave(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.jamRoomService.leave(id, req.user.id);
    return { message: '합주방에서 나갔습니다' };
  }

  @Get(':id/participants')
  @ApiOperation({ summary: '합주방 참가자 목록' })
  getParticipants(@Param('id') id: string) {
    return this.jamRoomService.getParticipants(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '합주방 닫기' })
  async close(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.jamRoomService.close(id, req.user.id);
    return { message: '합주방을 닫았습니다' };
  }
}
