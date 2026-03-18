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

import { SubscribeDto } from './dto/subscribe.dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscriptions')
@Controller('api/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: '구독 플랜 목록 조회' })
  @ApiResponse({ status: 200, description: '플랜 목록 반환' })
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get('current')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 구독 상태 조회' })
  @ApiResponse({ status: 200, description: '현재 구독 상태 반환' })
  getCurrent(@Request() req: { user: { id: string } }) {
    return this.subscriptionService.getCurrentSubscription(req.user.id);
  }

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 시작/변경' })
  @ApiResponse({ status: 201, description: '구독 성공' })
  @ApiResponse({ status: 400, description: '이미 동일 플랜 구독 중' })
  subscribe(
    @Request() req: { user: { id: string } },
    @Body() dto: SubscribeDto,
  ) {
    return this.subscriptionService.subscribe(
      req.user.id,
      dto.plan,
      dto.externalPaymentId,
    );
  }

  @Post('cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 취소' })
  @ApiResponse({ status: 201, description: '구독 취소 성공' })
  @ApiResponse({ status: 404, description: '활성 구독 없음' })
  cancel(@Request() req: { user: { id: string } }) {
    return this.subscriptionService.cancel(req.user.id);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 이력 조회' })
  @ApiResponse({ status: 200, description: '구독 이력 반환' })
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
  getHistory(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptionService.getHistory(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
