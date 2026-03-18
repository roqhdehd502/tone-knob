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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '결제 요청 생성' })
  @ApiResponse({ status: 201, description: '결제 요청 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  createPayment(
    @Request() req: { user: { id: string } },
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentService.createPayment(req.user.id, dto);
  }

  @Post(':id/confirm')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '결제 확인' })
  @ApiResponse({ status: 201, description: '결제 확인 성공' })
  @ApiResponse({ status: 404, description: '결제 건을 찾을 수 없음' })
  confirmPayment(@Param('id') id: string, @Body() dto: ConfirmPaymentDto) {
    return this.paymentService.confirmPayment(id, dto.externalPaymentId);
  }

  @Post(':id/refund')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '환불 처리' })
  @ApiResponse({ status: 201, description: '환불 성공' })
  @ApiResponse({ status: 400, description: '환불 불가 상태' })
  refundPayment(@Param('id') id: string) {
    return this.paymentService.refundPayment(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '결제 상세 조회' })
  @ApiResponse({ status: 200, description: '결제 상세 반환' })
  @ApiResponse({ status: 404, description: '결제 건을 찾을 수 없음' })
  getPayment(@Param('id') id: string) {
    return this.paymentService.getPaymentById(id);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 결제 내역' })
  @ApiResponse({ status: 200, description: '결제 내역 반환' })
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
