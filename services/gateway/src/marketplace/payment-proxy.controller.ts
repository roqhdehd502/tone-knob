import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ConfirmPaymentDto, CreatePaymentDto } from '@tone-knob/shared';
import { firstValueFrom } from 'rxjs';

import { CurrentUser, RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RpcToHttpExceptionFilter } from '../common/rpc-exception.filter';

@ApiTags('Payments')
@Controller('api/payments')
@UseFilters(RpcToHttpExceptionFilter)
export class PaymentProxyController {
  constructor(
    @Inject('MARKETPLACE_SERVICE') private readonly marketplaceClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '결제 생성 (PENDING)',
    description: 'PG사 결제창을 띄우기 전, 대기(pending) 상태의 결제 레코드를 먼저 생성합니다. 실제 승인은 PG사 결제 완료 후 /api/payments/:id/confirm으로 처리합니다.',
  })
  @ApiResponse({ status: 201, description: '생성된 결제(pending) 반환' })
  async createPayment(
    @CurrentUser() user: RequestUser,
    @Body() body: CreatePaymentDto,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('payment.create', { userId: user.id, ...body }),
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 결제 내역 조회', description: '로그인한 사용자의 결제 내역을 최신순으로 조회합니다.' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값 20)' })
  @ApiResponse({ status: 200, description: '결제 내역 목록 반환' })
  async getMyPayments(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('payment.getMyPayments', {
        userId: user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary: '결제 승인 확정 (PG사 콜백)',
    description: 'PG사(토스페이먼츠 등) 결제 완료 후 호출해 결제 상태를 completed로 확정합니다.',
  })
  @ApiParam({ name: 'id', description: '결제 ID' })
  @ApiResponse({ status: 200, description: '승인 완료된 결제 반환' })
  @ApiResponse({ status: 404, description: '결제 내역을 찾을 수 없음' })
  async confirmPayment(
    @Param('id') id: string,
    @Body() body: ConfirmPaymentDto,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('payment.confirm', { paymentId: id, externalPaymentId: body.externalPaymentId }),
    );
  }

  @Post(':id/refund')
  @ApiOperation({ summary: '결제 환불 처리', description: '완료(completed) 상태의 결제만 환불할 수 있습니다.' })
  @ApiParam({ name: 'id', description: '결제 ID' })
  @ApiResponse({ status: 200, description: '환불 완료된 결제 반환' })
  @ApiResponse({ status: 400, description: '완료 상태가 아닌 결제는 환불 불가' })
  async refundPayment(@Param('id') id: string) {
    return firstValueFrom(
      this.marketplaceClient.send('payment.refund', { paymentId: id }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '결제 상세 조회', description: '결제 ID로 단건 결제 정보(상태, 금액, PG사 승인 키 등)를 조회합니다.' })
  @ApiParam({ name: 'id', description: '결제 ID' })
  @ApiResponse({ status: 200, description: '결제 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '결제 내역을 찾을 수 없음' })
  async getPayment(@Param('id') id: string) {
    return firstValueFrom(
      this.marketplaceClient.send('payment.getById', { paymentId: id }),
    );
  }
}
