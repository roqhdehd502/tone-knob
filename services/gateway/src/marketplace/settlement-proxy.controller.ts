import {
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { firstValueFrom } from 'rxjs';

import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RpcToHttpExceptionFilter } from '../common/rpc-exception.filter';

@ApiTags('Settlements')
@Controller('api/settlements')
@UseFilters(RpcToHttpExceptionFilter)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettlementProxyController {
  constructor(
    @Inject('MARKETPLACE_SERVICE') private readonly marketplaceClient: ClientProxy,
  ) {}

  @Post('request')
  @ApiOperation({
    summary: '정산 신청',
    description: '판매자가 누적된 미정산 매출에 대한 정산을 신청합니다. 실제 지급은 매월 자동 실행되는 정산 스케줄러를 통해 처리됩니다.',
  })
  @ApiResponse({ status: 201, description: '생성된 정산 신청 반환' })
  @ApiResponse({ status: 400, description: '정산 가능한 매출이 없음' })
  async requestSettlement(@CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.marketplaceClient.send('settlement.request', { sellerId: user.id }),
    );
  }

  @Get('my')
  @ApiOperation({ summary: '내 정산 내역 조회', description: '판매자 본인의 정산 신청/지급 내역을 최신순으로 조회합니다.' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값 20)' })
  @ApiResponse({ status: 200, description: '정산 내역 목록 반환' })
  async getMySettlements(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('settlement.getMy', {
        sellerId: user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get('summary')
  @ApiOperation({ summary: '정산 요약 조회', description: '판매자의 총 매출, 수수료, 지급 완료액, 미정산(대기) 금액을 요약해 조회합니다.' })
  @ApiResponse({ status: 200, description: '{ totalRevenue, totalFees, totalPaid, pendingAmount } 반환' })
  async getSummary(@CurrentUser() user: RequestUser) {
    return firstValueFrom(
      this.marketplaceClient.send('settlement.summary', { sellerId: user.id }),
    );
  }
}
