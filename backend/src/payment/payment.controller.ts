import {
  Body,
  Controller,
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
  ApiTags,
} from '@nestjs/swagger';

import { PaymentType } from '../entities/payment.entity';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '결제 요청 생성' })
  createPayment(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      type: PaymentType;
      amount: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.paymentService.createPayment(req.user.id, body);
  }

  @Post(':id/confirm')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '결제 확인' })
  confirmPayment(
    @Param('id') id: string,
    @Body() body: { externalPaymentId: string },
  ) {
    return this.paymentService.confirmPayment(id, body.externalPaymentId);
  }

  @Post(':id/refund')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '환불 처리' })
  refundPayment(@Param('id') id: string) {
    return this.paymentService.refundPayment(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '결제 상세 조회' })
  getPayment(@Param('id') id: string) {
    return this.paymentService.getPaymentById(id);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 결제 내역' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyPayments(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentService.getMyPayments(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
