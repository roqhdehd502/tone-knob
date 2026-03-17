import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('api/payments')
export class PaymentProxyController {
  constructor(
    @Inject('MARKETPLACE_SERVICE') private readonly marketplaceClient: ClientProxy,
  ) {}

  @Post()
  async createPayment(
    @Request() req: { user: { id: string } },
    @Body() body: { type: string; amount: number; metadata?: Record<string, unknown> },
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('payment.create', { userId: req.user.id, ...body }),
    );
  }

  @Post(':id/confirm')
  async confirmPayment(
    @Param('id') id: string,
    @Body() body: { externalPaymentId: string },
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('payment.confirm', { paymentId: id, externalPaymentId: body.externalPaymentId }),
    );
  }

  @Post(':id/refund')
  async refundPayment(@Param('id') id: string) {
    return firstValueFrom(
      this.marketplaceClient.send('payment.refund', { paymentId: id }),
    );
  }

  @Get(':id')
  async getPayment(@Param('id') id: string) {
    return firstValueFrom(
      this.marketplaceClient.send('payment.getById', { paymentId: id }),
    );
  }

  @Get('my')
  async getMyPayments(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('payment.getMyPayments', {
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }
}
