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

import { SubscriptionPlan } from '../entities/subscription.entity';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscriptions')
@Controller('api/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: '구독 플랜 목록 조회' })
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get('current')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 구독 상태 조회' })
  getCurrent(@Request() req: { user: { id: string } }) {
    return this.subscriptionService.getCurrentSubscription(req.user.id);
  }

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 시작/변경' })
  subscribe(
    @Request() req: { user: { id: string } },
    @Body() body: { plan: SubscriptionPlan; externalPaymentId?: string },
  ) {
    return this.subscriptionService.subscribe(
      req.user.id,
      body.plan,
      body.externalPaymentId,
    );
  }

  @Post('cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 취소' })
  cancel(@Request() req: { user: { id: string } }) {
    return this.subscriptionService.cancel(req.user.id);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 이력 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
