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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateRecordingDto } from './dto/create-recording.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import { RecordingService } from './recording.service';

@ApiTags('recordings')
@Controller('api/recordings')
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '녹음 생성' })
  @ApiResponse({ status: 201, description: '녹음 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateRecordingDto,
  ) {
    return this.recordingService.create(req.user.id, dto);
  }

  @Get('public')
  @ApiOperation({ summary: '공개 녹음 목록' })
  @ApiResponse({ status: 200, description: '공개 녹음 목록 조회 성공' })
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
  @ApiResponse({ status: 200, description: '내 녹음 목록 조회 성공' })
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
  @ApiResponse({ status: 200, description: '녹음 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '녹음을 찾을 수 없음' })
  findById(@Param('id') id: string) {
    return this.recordingService.findById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '녹음 수정' })
  @ApiResponse({ status: 200, description: '녹음 수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateRecordingDto,
  ) {
    return this.recordingService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '녹음 삭제' })
  @ApiResponse({ status: 200, description: '녹음 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  delete(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.recordingService.delete(req.user.id, id);
  }

  @Post(':id/play')
  @ApiOperation({ summary: '재생 카운트 증가' })
  @ApiResponse({ status: 201, description: '재생 카운트 증가 성공' })
  incrementPlayCount(@Param('id') id: string) {
    return this.recordingService.incrementPlayCount(id);
  }

  @Get(':id/share')
  @ApiOperation({ summary: '공유 URL 생성' })
  @ApiResponse({ status: 200, description: '공유 URL 반환' })
  getShareUrl(@Param('id') id: string) {
    return this.recordingService.getShareUrl(id);
  }
}
