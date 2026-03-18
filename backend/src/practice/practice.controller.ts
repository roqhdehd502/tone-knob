import {
  Body,
  Controller,
  Get,
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

import { RecordSessionDto } from './dto/record-session.dto';
import { PracticeService } from './practice.service';

@ApiTags('practice')
@Controller('api/practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '연습 세션 기록' })
  @ApiResponse({ status: 201, description: '세션 기록 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  recordSession(
    @Request() req: { user: { id: string } },
    @Body() dto: RecordSessionDto,
  ) {
    return this.practiceService.recordSession(req.user.id, dto);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '연습 통계 조회' })
  @ApiResponse({ status: 200, description: '통계 조회 성공' })
  getStats(@Request() req: { user: { id: string } }) {
    return this.practiceService.getStats(req.user.id);
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '최근 연습 세션 목록' })
  @ApiResponse({ status: 200, description: '세션 목록 조회 성공' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호 (기본 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수 (기본 20)',
  })
  getRecentSessions(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.practiceService.getRecentSessions(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
