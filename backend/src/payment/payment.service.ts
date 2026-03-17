import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '../entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  // 결제 요청 생성 (Toss Payments 연동 준비)
  async createPayment(
    userId: string,
    data: {
      type: PaymentType;
      amount: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<Payment> {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const payment = this.paymentRepository.create({
      userId,
      type: data.type,
      amount: data.amount,
      status: PaymentStatus.PENDING,
      externalOrderId: orderId,
      metadata: data.metadata,
    });

    return this.paymentRepository.save(payment);
  }

  // 결제 확인 (웹훅 또는 클라이언트 콜백)
  async confirmPayment(
    paymentId: string,
    externalPaymentId: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('결제 내역을 찾을 수 없습니다');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('이미 처리된 결제입니다');
    }

    // TODO: 실제 Toss Payments API로 결제 검증
    // const verified = await this.tossPaymentsClient.verify(externalPaymentId, payment.amount);

    payment.status = PaymentStatus.COMPLETED;
    payment.externalPaymentId = externalPaymentId;
    return this.paymentRepository.save(payment);
  }

  // 환불 처리
  async refundPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('결제 내역을 찾을 수 없습니다');
    }
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('완료된 결제만 환불할 수 있습니다');
    }

    // TODO: 실제 Toss Payments API로 환불 요청
    // await this.tossPaymentsClient.refund(payment.externalPaymentId, payment.amount);

    payment.status = PaymentStatus.REFUNDED;
    return this.paymentRepository.save(payment);
  }

  async getPaymentById(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('결제 내역을 찾을 수 없습니다');
    }
    return payment;
  }

  async getMyPayments(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Payment[]; total: number }> {
    const [data, total] = await this.paymentRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
