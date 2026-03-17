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
  ApiTags,
} from '@nestjs/swagger';

import { PracticeService } from './practice.service';

@ApiTags('practice')
@Controller('api/practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '연습 세션 기록' })
  recordSession(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      tabId?: string;
      durationSeconds: number;
      bpm?: number;
      speedMultiplier?: number;
      loopStartMeasure?: number;
      loopEndMeasure?: number;
    },
  ) {
    return this.practiceService.recordSession(req.user.id, body);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '연습 통계 조회' })
  getStats(@Request() req: { user: { id: string } }) {
    return this.practiceService.getStats(req.user.id);
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '최근 연습 세션 목록' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
