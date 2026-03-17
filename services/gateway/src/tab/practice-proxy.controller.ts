import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { catchError, firstValueFrom, throwError } from 'rxjs';

import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RpcToHttpExceptionFilter } from '../common/rpc-exception.filter';

@ApiTags('Practice')
@Controller('api/practice')
@UseFilters(RpcToHttpExceptionFilter)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PracticeProxyController {
  constructor(
    @Inject('TAB_SERVICE') private readonly tabClient: ClientProxy,
  ) {}

  @Post('sessions')
  @ApiOperation({ summary: '연습 세션 기록' })
  async recordSession(@CurrentUser() user: RequestUser, @Body() dto: Record<string, unknown>) {
    return firstValueFrom(
      this.tabClient.send('practice.record', { userId: user.id, dto }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Get('stats')
  @ApiOperation({ summary: '연습 통계 조회' })
  async getStats(@CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.tabClient.send('practice.stats', { userId: user.id }).pipe(
        catchError((err) => throwError(() => err)),
      ),
    );
  }

  @Get('sessions')
  @ApiOperation({ summary: '최근 연습 세션 목록' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentSessions(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.tabClient.send('practice.recent', {
        userId: user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }).pipe(catchError((err) => throwError(() => err))),
    );
  }
}
