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
  ApiResponse,
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
  @ApiResponse({ status: 201, description: '합주방 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateJamRoomDto,
  ) {
    return this.jamRoomService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '합주방 목록 조회' })
  @ApiResponse({ status: 200, description: '합주방 목록 반환' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: '활성 상태 필터',
  })
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
  @ApiResponse({ status: 200, description: '합주방 상세 반환' })
  @ApiResponse({ status: 404, description: '합주방을 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.jamRoomService.findOne(id);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '합주방 참가' })
  @ApiResponse({ status: 201, description: '참가 성공' })
  @ApiResponse({ status: 400, description: '정원 초과 / 비밀번호 불일치' })
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
  @ApiResponse({ status: 201, description: '합주방에서 나감' })
  async leave(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.jamRoomService.leave(id, req.user.id);
    return { message: '합주방에서 나갔습니다' };
  }

  @Get(':id/participants')
  @ApiOperation({ summary: '합주방 참가자 목록' })
  @ApiResponse({ status: 200, description: '참가자 목록 반환' })
  getParticipants(@Param('id') id: string) {
    return this.jamRoomService.getParticipants(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '합주방 닫기' })
  @ApiResponse({ status: 200, description: '합주방 닫기 성공' })
  @ApiResponse({ status: 403, description: '방장만 닫을 수 있음' })
  async close(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.jamRoomService.close(id, req.user.id);
    return { message: '합주방을 닫았습니다' };
  }
}
