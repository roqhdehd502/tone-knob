import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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

import { RecordingVisibility } from '../entities/recording.entity';
import { RecordingService } from './recording.service';

@ApiTags('recordings')
@Controller('api/recordings')
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '녹음 생성' })
  create(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      title: string;
      description?: string;
      audioUrl: string;
      durationSeconds: number;
      tabId?: string;
      visibility?: RecordingVisibility;
    },
  ) {
    return this.recordingService.create(req.user.id, body);
  }

  @Get('public')
  @ApiOperation({ summary: '공개 녹음 목록' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findPublic(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.recordingService.findPublic(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 녹음 목록' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findMy(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recordingService.findByUser(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '녹음 상세 조회' })
  findById(@Param('id') id: string) {
    return this.recordingService.findById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '녹음 수정' })
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      visibility?: RecordingVisibility;
    },
  ) {
    return this.recordingService.update(req.user.id, id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '녹음 삭제' })
  delete(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.recordingService.delete(req.user.id, id);
  }

  @Post(':id/play')
  @ApiOperation({ summary: '재생 카운트 증가' })
  incrementPlayCount(@Param('id') id: string) {
    return this.recordingService.incrementPlayCount(id);
  }

  @Get(':id/share')
  @ApiOperation({ summary: '공유 URL 생성' })
  getShareUrl(@Param('id') id: string) {
    return this.recordingService.getShareUrl(id);
  }
}
